# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json
Shard SHA256: 3d2bbc942e416345213d8b225e43ee69a2f63149f6b8768e23017f5dc829ed68
Source: docs/specs/confinement-authority.md
Part 6/7; entries: **25**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/20 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [
      "claim_2977601fcac216f335c121ce5a58ec9e",
      "claim_d81f120837aab96ba270276e5090e2e0",
      "claim_34983077687032d7a49ecc61907a6806",
      "claim_d9f0a2209948f0357cac70dc0778b0bb",
      "claim_f82a2cff173a458bb2231203222c10e0"
    ],
    "Weak-exact": [
      "claim_78563a2491b11f7a0b412c5b900a7414",
      "claim_dc8b5bc2507201dd705fcd64deba8224",
      "claim_b532b9a9eb7f76d041c343e2d45bf859",
      "claim_e793bd095f4a872b0bc08757c827359f",
      "claim_c030fece276e5228ec08051c9b243dd4",
      "claim_7aede254166851de375089f4b0160ca6",
      "claim_84e60054f3f70565af1fcf9c09352d83",
      "claim_53e0df53a67f6897195cbf23839c6c9b",
      "claim_39c40cef341e227d936ea768b12ba435",
      "claim_eaadf6a68a7c7f9ed4005478db93c95b",
      "claim_e017f3c0a36bb052472cf9ad2bd616b4",
      "claim_81ec7e246f5d04771ed8242d9f45a51c",
      "claim_0da9c2a174db070122d3b5c6af25e677",
      "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
      "claim_022af2ccb616ad85400526fd94408258",
      "claim_19c1aba20ad51fafc86dc889996c2063",
      "claim_3f1a1bbd362edb4ff925ff6de3cbd823",
      "claim_3751f92605ff426f0c91aea00cf436f9",
      "claim_3a59166febcee14eae6a7815533da0b8",
      "claim_9926460074ef65ebbb208553bc11562e"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "noTargetGeneratedRows": [],
  "mandatoryDeep": []
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_78563a2491b11f7a0b412c5b900a7414

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#113-behavior-probes; lines 1287–1287; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Target: docs/platform/agent-confinement/spec.md#113-behavior-probes; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Source digest: a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311
Target digest: a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311
Shown source SHA256: 37b19b2bedbde6744e3d98181212a87fdc1fd3279aa1c6dd8afc1745f24ab839
Shown target SHA256: 37b19b2bedbde6744e3d98181212a87fdc1fd3279aa1c6dd8afc1745f24ab839

### Complete proposed decision

```json
{
  "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
  "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "113-behavior-probes",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#113-behavior-probes (source lines 1287-1287) is carried at docs/platform/agent-confinement/spec.md#113-behavior-probes (candidate lines 536-536). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done"
  ]
}
```

### Full source shown text

```text
### 11.3 Behavior probes

Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:

- ghi vào `run-output` của chính dispatch thành công;
- host-write-denied: ghi vào cwd/repo root bị chặn;
- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;
  probe riêng Git metadata ownership và commit readiness;
- ghi vào run directory của dispatch khác bị chặn;
- private home ghi được nhưng real host home bị chặn;
- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel
  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;
- `executor-credentials` grant đọc được nhưng không ghi được;
- host read và network vẫn khả dụng, để chứng minh attestation không overclaim.

Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong
proof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe
provider thay đổi không invalidate backend proof không liên quan.
```

### Full target shown text

```text
### 11.3 Behavior probes

Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:

- ghi vào `run-output` của chính dispatch thành công;
- host-write-denied: ghi vào cwd/repo root bị chặn;
- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;
  probe riêng Git metadata ownership và commit readiness;
- ghi vào run directory của dispatch khác bị chặn;
- private home ghi được nhưng real host home bị chặn;
- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel
  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;
- `executor-credentials` grant đọc được nhưng không ghi được;
- host read và network vẫn khả dụng, để chứng minh attestation không overclaim.

Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong
proof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe
provider thay đổi không invalidate backend proof không liên quan.
```

## claim_2977601fcac216f335c121ce5a58ec9e

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-131; lines 1289–1289; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.3 Behavior probes"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-62; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.3 Behavior probes"].
Source digest: 6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8
Target digest: 6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8
Shown source SHA256: 6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8
Shown target SHA256: 6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8

### Complete proposed decision

```json
{
  "claimId": "claim_2977601fcac216f335c121ce5a58ec9e",
  "sourceUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-62",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-131 (source lines 1289-1289) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-62 (candidate lines 538-538). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.3 Behavior probes"
  ]
}
```

### Full source shown text

```text
Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:
```

### Full target shown text

```text
Probe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:
```

## claim_d81f120837aab96ba270276e5090e2e0

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-132; lines 1291–1300; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.3 Behavior probes"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-63; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.3 Behavior probes"].
Source digest: e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129
Target digest: e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129
Shown source SHA256: e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129
Shown target SHA256: e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129

### Complete proposed decision

```json
{
  "claimId": "claim_d81f120837aab96ba270276e5090e2e0",
  "sourceUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-63",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-132 (source lines 1291-1300) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-63 (candidate lines 540-549). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e3281f44b9de246979eb391c466d2aec235d67fd39c35775a42a31261ae2a129",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.3 Behavior probes"
  ]
}
```

### Full source shown text

```text
- ghi vào `run-output` của chính dispatch thành công;
- host-write-denied: ghi vào cwd/repo root bị chặn;
- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;
  probe riêng Git metadata ownership và commit readiness;
- ghi vào run directory của dispatch khác bị chặn;
- private home ghi được nhưng real host home bị chặn;
- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel
  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;
- `executor-credentials` grant đọc được nhưng không ghi được;
- host read và network vẫn khả dụng, để chứng minh attestation không overclaim.
```

### Full target shown text

```text
- ghi vào `run-output` của chính dispatch thành công;
- host-write-denied: ghi vào cwd/repo root bị chặn;
- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;
  probe riêng Git metadata ownership và commit readiness;
- ghi vào run directory của dispatch khác bị chặn;
- private home ghi được nhưng real host home bị chặn;
- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel
  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;
- `executor-credentials` grant đọc được nhưng không ghi được;
- host read và network vẫn khả dụng, để chứng minh attestation không overclaim.
```

## claim_34983077687032d7a49ecc61907a6806

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-133; lines 1302–1304; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.3 Behavior probes"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-64; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.3 Behavior probes"].
Source digest: 81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7
Target digest: 81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7
Shown source SHA256: 81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7
Shown target SHA256: 81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7

### Complete proposed decision

```json
{
  "claimId": "claim_34983077687032d7a49ecc61907a6806",
  "sourceUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-64",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-133 (source lines 1302-1304) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-64 (candidate lines 551-553). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "81541208991d526412de79630015558afcc29113e90b9e33d5818071621c09f7",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.3 Behavior probes"
  ]
}
```

### Full source shown text

```text
Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong
proof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe
provider thay đổi không invalidate backend proof không liên quan.
```

### Full target shown text

```text
Probe input/assertion độc lập với declarative claims. Thay đổi dependency trong
proof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe
provider thay đổi không invalidate backend proof không liên quan.
```

## claim_dc8b5bc2507201dd705fcd64deba8224

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#114-observability; lines 1306–1306; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Target: docs/platform/agent-confinement/spec.md#114-observability; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Source digest: 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e
Target digest: 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e
Shown source SHA256: 9522b52bbb69e56fb264cb9217855ababd98c0b429a5d5621f59cce475a14c0a
Shown target SHA256: 9522b52bbb69e56fb264cb9217855ababd98c0b429a5d5621f59cce475a14c0a

### Complete proposed decision

```json
{
  "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
  "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "114-observability",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#114-observability (source lines 1306-1306) is carried at docs/platform/agent-confinement/spec.md#114-observability (candidate lines 555-555). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done"
  ]
}
```

### Full source shown text

```text
### 11.4 Observability

- Pin posture của cả 17 executor hiện tại.
- Pin exact write grant của ba executor bwrap.
- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.
- Event/run record lưu `confinement-attestation.v1` và mismatch.
- Log stdout/stderr không chứa credential value.
```

### Full target shown text

```text
### 11.4 Observability

- Pin posture của cả 17 executor hiện tại.
- Pin exact write grant của ba executor bwrap.
- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.
- Event/run record lưu `confinement-attestation.v1` và mismatch.
- Log stdout/stderr không chứa credential value.
```

## claim_d9f0a2209948f0357cac70dc0778b0bb

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-134; lines 1308–1312; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.4 Observability"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-65; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.4 Observability"].
Source digest: 0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc
Target digest: 0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc
Shown source SHA256: 0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc
Shown target SHA256: 0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc

### Complete proposed decision

```json
{
  "claimId": "claim_d9f0a2209948f0357cac70dc0778b0bb",
  "sourceUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-65",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-134 (source lines 1308-1312) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-65 (candidate lines 557-561). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.4 Observability"
  ]
}
```

### Full source shown text

```text
- Pin posture của cả 17 executor hiện tại.
- Pin exact write grant của ba executor bwrap.
- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.
- Event/run record lưu `confinement-attestation.v1` và mismatch.
- Log stdout/stderr không chứa credential value.
```

### Full target shown text

```text
- Pin posture của cả 17 executor hiện tại.
- Pin exact write grant của ba executor bwrap.
- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.
- Event/run record lưu `confinement-attestation.v1` và mismatch.
- Log stdout/stderr không chứa credential value.
```

## claim_b532b9a9eb7f76d041c343e2d45bf859

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#115-doctorsetup; lines 1314–1314; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Target: docs/platform/agent-confinement/spec.md#115-doctorsetup; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done"].
Source digest: 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe
Target digest: 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe
Shown source SHA256: 158cfcf440041895e8acef7b1ad7fcf3394d0a2be1a088531772f840606689a1
Shown target SHA256: 158cfcf440041895e8acef7b1ad7fcf3394d0a2be1a088531772f840606689a1

### Complete proposed decision

```json
{
  "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
  "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "115-doctorsetup",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. The whole heading unit docs/specs/confinement-authority.md#115-doctorsetup (source lines 1314-1314) is carried at docs/platform/agent-confinement/spec.md#115-doctorsetup (candidate lines 563-563). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done"
  ]
}
```

### Full source shown text

```text
### 11.5 Doctor/setup

Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry
instance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform
support, namespace/mount prerequisite, runDir writable, credential source
readable và probe freshness. `fgos setup` tạo/fill missing backend instance
trong machine registry mà không ghi đè custom value; shared project/global
config vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,
`disabled`, `unavailable` và `ready`.
```

### Full target shown text

```text
### 11.5 Doctor/setup

Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry
instance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform
support, namespace/mount prerequisite, runDir writable, credential source
readable và probe freshness. `fgos setup` tạo/fill missing backend instance
trong machine registry mà không ghi đè custom value; shared project/global
config vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,
`disabled`, `unavailable` và `ready`.
```

## claim_f82a2cff173a458bb2231203222c10e0

Class: Unit-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-135; lines 1316–1322; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.5 Doctor/setup"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-66; ancestry ["Spec: Agent Confinement Authority","11. Proof và Definition of Done","11.5 Doctor/setup"].
Source digest: 03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5
Target digest: 03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5
Shown source SHA256: 03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5
Shown target SHA256: 03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5

### Complete proposed decision

```json
{
  "claimId": "claim_f82a2cff173a458bb2231203222c10e0",
  "sourceUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-66",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-135 (source lines 1316-1322) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-66 (candidate lines 565-571). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "11. Proof và Definition of Done",
    "11.5 Doctor/setup"
  ]
}
```

### Full source shown text

```text
Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry
instance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform
support, namespace/mount prerequisite, runDir writable, credential source
readable và probe freshness. `fgos setup` tạo/fill missing backend instance
trong machine registry mà không ghi đè custom value; shared project/global
config vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,
`disabled`, `unavailable` và `ready`.
```

### Full target shown text

```text
Mỗi backend driver đăng ký check schema/capability và mỗi machine-registry
instance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform
support, namespace/mount prerequisite, runDir writable, credential source
readable và probe freshness. `fgos setup` tạo/fill missing backend instance
trong machine registry mà không ghi đè custom value; shared project/global
config vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,
`disabled`, `unavailable` và `ready`.
```

## claim_e793bd095f4a872b0bc08757c827359f

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#12-quyết-định-của-proposal; lines 1324–1324; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; ancestry ["Added in candidate: confinement authority decisions"].
Source digest: 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f
Target digest: 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f
Shown source SHA256: 49b3fd95a21083e3ea09a982ed511c23e94848145704840c70a726e0c8cae1cb
Shown target SHA256: 49b3fd95a21083e3ea09a982ed511c23e94848145704840c70a726e0c8cae1cb

### Complete proposed decision

```json
{
  "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
  "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "12-quyết-định-của-proposal",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#12-quyết-định-của-proposal (source lines 1324-1324) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal (candidate lines 24-24). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions"
  ]
}
```

### Full source shown text

```text
## 12. Quyết định của proposal

| Quyết định | Lý do |
|---|---|
| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |
| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |
| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |
| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |
| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |
| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |
| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |
| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |
| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |
| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |
| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |
| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |
```

### Full target shown text

```text
## 12. Quyết định của proposal

| Quyết định | Lý do |
|---|---|
| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |
| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |
| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |
| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |
| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |
| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |
| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |
| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |
| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |
| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |
| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |
| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |
```

## claim_c030fece276e5228ec08051c9b243dd4

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-136; lines 1326–1339; ancestry ["Spec: Agent Confinement Authority","12. Quyết định của proposal"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-3; ancestry ["Added in candidate: confinement authority decisions","12. Quyết định của proposal"].
Source digest: 92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1
Target digest: 92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1
Shown source SHA256: 92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1
Shown target SHA256: 92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1

### Complete proposed decision

```json
{
  "claimId": "claim_c030fece276e5228ec08051c9b243dd4",
  "sourceUnitDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "unheaded-block-3",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-136 (source lines 1326-1339) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-3 (candidate lines 26-39). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions",
    "12. Quyết định của proposal"
  ]
}
```

### Full source shown text

```text
| Quyết định | Lý do |
|---|---|
| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |
| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |
| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |
| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |
| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |
| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |
| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |
| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |
| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |
| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |
| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |
| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |
```

### Full target shown text

```text
| Quyết định | Lý do |
|---|---|
| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |
| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |
| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |
| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |
| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |
| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |
| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |
| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |
| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |
| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |
| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |
| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |
```

## claim_7aede254166851de375089f4b0160ca6

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; lines 1341–1341; ancestry ["Spec: Agent Confinement Authority"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; ancestry ["Added in candidate: rollout and settled facts"].
Source digest: 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f
Target digest: 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f
Shown source SHA256: de1a76f926e8c5a24b63e010e84cc94ba2e041ba6d67adf78f9b16835654904c
Shown target SHA256: de1a76f926e8c5a24b63e010e84cc94ba2e041ba6d67adf78f9b16835654904c

### Complete proposed decision

```json
{
  "claimId": "claim_7aede254166851de375089f4b0160ca6",
  "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (source lines 1341-1341) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (candidate lines 39-39). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts"
  ]
}
```

### Full source shown text

```text
## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)

Bảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:

1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).
2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).
3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).
4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).
5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).
6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).
7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).
```

### Full target shown text

```text
## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)

Bảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:

1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).
2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).
3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).
4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).
5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).
6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).
7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).
```

## claim_84e60054f3f70565af1fcf9c09352d83

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-137; lines 1343–1343; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-5; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Source digest: a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea
Target digest: a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea
Shown source SHA256: a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea
Shown target SHA256: a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea

### Complete proposed decision

```json
{
  "claimId": "claim_84e60054f3f70565af1fcf9c09352d83",
  "sourceUnitDigest": "a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-137 (source lines 1343-1343) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-5 (candidate lines 41-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
  ]
}
```

### Full source shown text

```text
Bảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:
```

### Full target shown text

```text
Bảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:
```

## claim_53e0df53a67f6897195cbf23839c6c9b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-138; lines 1345–1351; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-6; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Source digest: d06ca4feb3fc1e931aa43134c6d30fe620ab3850b195c9d1dd417a68464059f4
Target digest: d06ca4feb3fc1e931aa43134c6d30fe620ab3850b195c9d1dd417a68464059f4
Shown source SHA256: d06ca4feb3fc1e931aa43134c6d30fe620ab3850b195c9d1dd417a68464059f4
Shown target SHA256: d06ca4feb3fc1e931aa43134c6d30fe620ab3850b195c9d1dd417a68464059f4

### Complete proposed decision

```json
{
  "claimId": "claim_53e0df53a67f6897195cbf23839c6c9b",
  "sourceUnitDigest": "d06ca4feb3fc1e931aa43134c6d30fe620ab3850b195c9d1dd417a68464059f4",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-138 (source lines 1345-1351) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-6 (candidate lines 43-49). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d06ca4feb3fc1e931aa43134c6d30fe620ab3850b195c9d1dd417a68464059f4",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
  ]
}
```

### Full source shown text

```text
1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).
2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).
3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).
4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).
5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).
6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).
7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).
```

### Full target shown text

```text
1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).
2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).
3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).
4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).
5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).
6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).
7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).
```

## claim_39c40cef341e227d936ea768b12ba435

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; lines 1353–1353; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Source digest: ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b
Target digest: ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b
Shown source SHA256: b2f5e17c7f8513cef7676efe07e15fe9f1b1a8b82f8278460d06caa69522b52b
Shown target SHA256: b2f5e17c7f8513cef7676efe07e15fe9f1b1a8b82f8278460d06caa69522b52b

### Complete proposed decision

```json
{
  "claimId": "claim_39c40cef341e227d936ea768b12ba435",
  "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (source lines 1353-1353) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (candidate lines 51-51). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
  ]
}
```

### Full source shown text

```text
### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên

**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):

1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.

**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` "dormant" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).

**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn "Codex bwrap" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase "facts" của kế hoạch chỉ hỏi về code hiện tại, không hỏi "trước đây đã có gì và vì sao bị bỏ". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` ("Before touching code").
```

### Full target shown text

```text
### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên

**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):

1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.

**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` "dormant" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).

**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn "Codex bwrap" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase "facts" của kế hoạch chỉ hỏi về code hiện tại, không hỏi "trước đây đã có gì và vì sao bị bỏ". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` ("Before touching code").
```

## claim_eaadf6a68a7c7f9ed4005478db93c95b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-139; lines 1355–1355; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-7; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Source digest: 09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3
Target digest: 09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3
Shown source SHA256: 09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3
Shown target SHA256: 09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3

### Complete proposed decision

```json
{
  "claimId": "claim_eaadf6a68a7c7f9ed4005478db93c95b",
  "sourceUnitDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-7",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-139 (source lines 1355-1355) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-7 (candidate lines 53-53). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
  ]
}
```

### Full source shown text

```text
**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):
```

### Full target shown text

```text
**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):
```

## claim_e017f3c0a36bb052472cf9ad2bd616b4

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-140; lines 1357–1359; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-8; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Source digest: 0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc
Target digest: 0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc
Shown source SHA256: 0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc
Shown target SHA256: 0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc

### Complete proposed decision

```json
{
  "claimId": "claim_e017f3c0a36bb052472cf9ad2bd616b4",
  "sourceUnitDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-8",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-140 (source lines 1357-1359) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-8 (candidate lines 55-57). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
  ]
}
```

### Full source shown text

```text
1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.
```

### Full target shown text

```text
1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.
```

## claim_81ec7e246f5d04771ed8242d9f45a51c

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-141; lines 1361–1361; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-9; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Source digest: 3adecc728b89a0251ef17f37a38077c58eb02791d61ae5358fbf4e73445230b5
Target digest: 3adecc728b89a0251ef17f37a38077c58eb02791d61ae5358fbf4e73445230b5
Shown source SHA256: 3adecc728b89a0251ef17f37a38077c58eb02791d61ae5358fbf4e73445230b5
Shown target SHA256: 3adecc728b89a0251ef17f37a38077c58eb02791d61ae5358fbf4e73445230b5

### Complete proposed decision

```json
{
  "claimId": "claim_81ec7e246f5d04771ed8242d9f45a51c",
  "sourceUnitDigest": "3adecc728b89a0251ef17f37a38077c58eb02791d61ae5358fbf4e73445230b5",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-9",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-141 (source lines 1361-1361) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-9 (candidate lines 59-59). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "3adecc728b89a0251ef17f37a38077c58eb02791d61ae5358fbf4e73445230b5",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
  ]
}
```

### Full source shown text

```text
**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` "dormant" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).
```

### Full target shown text

```text
**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` "dormant" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).
```

## claim_0da9c2a174db070122d3b5c6af25e677

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-142; lines 1363–1363; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Target: docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-10; ancestry ["Added in candidate: rollout and settled facts","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"].
Source digest: ae79ac51f3a5a094bad8bc45affea34150699320dc4e427a6a8b8653b5ea8c6d
Target digest: ae79ac51f3a5a094bad8bc45affea34150699320dc4e427a6a8b8653b5ea8c6d
Shown source SHA256: ae79ac51f3a5a094bad8bc45affea34150699320dc4e427a6a8b8653b5ea8c6d
Shown target SHA256: ae79ac51f3a5a094bad8bc45affea34150699320dc4e427a6a8b8653b5ea8c6d

### Complete proposed decision

```json
{
  "claimId": "claim_0da9c2a174db070122d3b5c6af25e677",
  "sourceUnitDigest": "ae79ac51f3a5a094bad8bc45affea34150699320dc4e427a6a8b8653b5ea8c6d",
  "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
  "targetAnchor": "unheaded-block-10",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-142 (source lines 1363-1363) is carried at docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-10 (candidate lines 61-61). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "ae79ac51f3a5a094bad8bc45affea34150699320dc4e427a6a8b8653b5ea8c6d",
  "targetAncestry": [
    "Added in candidate: rollout and settled facts",
    "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên"
  ]
}
```

### Full source shown text

```text
**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn "Codex bwrap" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase "facts" của kế hoạch chỉ hỏi về code hiện tại, không hỏi "trước đây đã có gì và vì sao bị bỏ". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` ("Before touching code").
```

### Full target shown text

```text
**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn "Codex bwrap" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase "facts" của kế hoạch chỉ hỏi về code hiện tại, không hỏi "trước đây đã có gì và vì sao bị bỏ". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` ("Before touching code").
```

## claim_bed90dbb7de2a5782fafcdb4a3d6e0da

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược; lines 1365–1365; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Target: docs/platform/agent-confinement/spec.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược; ancestry ["Spec: Agent Confinement Authority","Added in candidate: Current settled facts and deferred items"].
Source digest: 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84
Target digest: 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84
Shown source SHA256: 75df82901a7cf062a15c8d8c6a07bae8465cbf96b662312d13ca558c9c65d354
Shown target SHA256: 75df82901a7cf062a15c8d8c6a07bae8465cbf96b662312d13ca558c9c65d354

### Complete proposed decision

```json
{
  "claimId": "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
  "sourceUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. The whole heading unit docs/specs/confinement-authority.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (source lines 1365-1365) is carried at docs/platform/agent-confinement/spec.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (candidate lines 575-575). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "Added in candidate: Current settled facts and deferred items"
  ]
}
```

### Full source shown text

```text
### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược

Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):

- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

### Full target shown text

```text
### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược

Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):

- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

## claim_022af2ccb616ad85400526fd94408258

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-143; lines 1367–1367; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-67; ancestry ["Spec: Agent Confinement Authority","Added in candidate: Current settled facts and deferred items","13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"].
Source digest: 9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae
Target digest: 9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae
Shown source SHA256: 9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae
Shown target SHA256: 9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae

### Complete proposed decision

```json
{
  "claimId": "claim_022af2ccb616ad85400526fd94408258",
  "sourceUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-67",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-143 (source lines 1367-1367) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-67 (candidate lines 577-577). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "Added in candidate: Current settled facts and deferred items",
    "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
  ]
}
```

### Full source shown text

```text
Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):
```

### Full target shown text

```text
Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):
```

## claim_19c1aba20ad51fafc86dc889996c2063

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-144; lines 1369–1370; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"].
Target: docs/platform/agent-confinement/spec.md#unheaded-block-68; ancestry ["Spec: Agent Confinement Authority","Added in candidate: Current settled facts and deferred items","13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"].
Source digest: f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3
Target digest: f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3
Shown source SHA256: f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3
Shown target SHA256: f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3

### Complete proposed decision

```json
{
  "claimId": "claim_19c1aba20ad51fafc86dc889996c2063",
  "sourceUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
  "targetOwner": "docs/platform/agent-confinement/spec.md",
  "targetAnchor": "unheaded-block-68",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-144 (source lines 1369-1370) is carried at docs/platform/agent-confinement/spec.md#unheaded-block-68 (candidate lines 579-580). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
  "targetAncestry": [
    "Spec: Agent Confinement Authority",
    "Added in candidate: Current settled facts and deferred items",
    "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
  ]
}
```

### Full source shown text

```text
- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

### Full target shown text

```text
- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

## claim_3f1a1bbd362edb4ff925ff6de3cbd823

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên; lines 1372–1372; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên; ancestry ["Added in candidate: confinement authority decisions","12. Quyết định của proposal"].
Source digest: 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad
Target digest: 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad
Shown source SHA256: bd74c4ee81ed2ca2d2d9acf519763bd3b7a97ac341b27cde3b45309bb91a24a4
Shown target SHA256: bd74c4ee81ed2ca2d2d9acf519763bd3b7a97ac341b27cde3b45309bb91a24a4

### Complete proposed decision

```json
{
  "claimId": "claim_3f1a1bbd362edb4ff925ff6de3cbd823",
  "sourceUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (source lines 1372-1372) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (candidate lines 41-41). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions",
    "12. Quyết định của proposal"
  ]
}
```

### Full source shown text

```text
### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên

**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.

**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.

**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.

**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
```

### Full target shown text

```text
### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên

**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.

**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.

**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.

**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
```

## claim_3751f92605ff426f0c91aea00cf436f9

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-145; lines 1374–1374; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-4; ancestry ["Added in candidate: confinement authority decisions","12. Quyết định của proposal","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Source digest: af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4
Target digest: af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4
Shown source SHA256: af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4
Shown target SHA256: af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4

### Complete proposed decision

```json
{
  "claimId": "claim_3751f92605ff426f0c91aea00cf436f9",
  "sourceUnitDigest": "af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "unheaded-block-4",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-145 (source lines 1374-1374) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-4 (candidate lines 43-43). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions",
    "12. Quyết định của proposal",
    "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"
  ]
}
```

### Full source shown text

```text
**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.
```

### Full target shown text

```text
**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.
```

## claim_3a59166febcee14eae6a7815533da0b8

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-146; lines 1376–1376; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-5; ancestry ["Added in candidate: confinement authority decisions","12. Quyết định của proposal","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Source digest: 6b135234f1db94662f8db717b7ce7f1b4911e2415c195e4715e7c2ae0987acd9
Target digest: 6b135234f1db94662f8db717b7ce7f1b4911e2415c195e4715e7c2ae0987acd9
Shown source SHA256: 6b135234f1db94662f8db717b7ce7f1b4911e2415c195e4715e7c2ae0987acd9
Shown target SHA256: 6b135234f1db94662f8db717b7ce7f1b4911e2415c195e4715e7c2ae0987acd9

### Complete proposed decision

```json
{
  "claimId": "claim_3a59166febcee14eae6a7815533da0b8",
  "sourceUnitDigest": "6b135234f1db94662f8db717b7ce7f1b4911e2415c195e4715e7c2ae0987acd9",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "unheaded-block-5",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-146 (source lines 1376-1376) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-5 (candidate lines 45-45). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "6b135234f1db94662f8db717b7ce7f1b4911e2415c195e4715e7c2ae0987acd9",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions",
    "12. Quyết định của proposal",
    "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"
  ]
}
```

### Full source shown text

```text
**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.
```

### Full target shown text

```text
**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.
```

## claim_9926460074ef65ebbb208553bc11562e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-147; lines 1378–1378; ancestry ["Spec: Agent Confinement Authority","13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Target: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-6; ancestry ["Added in candidate: confinement authority decisions","12. Quyết định của proposal","13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"].
Source digest: 7a4a02217b1fb56fa31b960e54231e46290d1c09d415ef8bbaf5dc32683f940b
Target digest: 7a4a02217b1fb56fa31b960e54231e46290d1c09d415ef8bbaf5dc32683f940b
Shown source SHA256: 7a4a02217b1fb56fa31b960e54231e46290d1c09d415ef8bbaf5dc32683f940b
Shown target SHA256: 7a4a02217b1fb56fa31b960e54231e46290d1c09d415ef8bbaf5dc32683f940b

### Complete proposed decision

```json
{
  "claimId": "claim_9926460074ef65ebbb208553bc11562e",
  "sourceUnitDigest": "7a4a02217b1fb56fa31b960e54231e46290d1c09d415ef8bbaf5dc32683f940b",
  "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
  "targetAnchor": "unheaded-block-6",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-147 (source lines 1378-1378) is carried at docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-6 (candidate lines 47-47). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7a4a02217b1fb56fa31b960e54231e46290d1c09d415ef8bbaf5dc32683f940b",
  "targetAncestry": [
    "Added in candidate: confinement authority decisions",
    "12. Quyết định của proposal",
    "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên"
  ]
}
```

### Full source shown text

```text
**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.
```

### Full target shown text

```text
**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.
```
