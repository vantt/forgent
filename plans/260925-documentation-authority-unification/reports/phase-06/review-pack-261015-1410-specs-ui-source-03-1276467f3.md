# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json
Shard SHA256: 3d2bbc942e416345213d8b225e43ee69a2f63149f6b8768e23017f5dc829ed68
Source: docs/specs/confinement-authority.md
Part 3/7; entries: **30**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 10/30 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_0870894b58e3cf580c819f86aaf4aca9",
      "claim_c24cc4613c3ac072520ef666a443b1ba",
      "claim_01eda8a43079cc517399ede91d3bb01f",
      "claim_c36cf0603526e446bd7db3af1dee79dd",
      "claim_c5ea3072dec5e438ecb6ab8cb6940180",
      "claim_f23b446a1760074a92c601a9f4613c04",
      "claim_4f30adc11320bb5e798a8bc0db62f495",
      "claim_cac60d0f1164309f87ede7041b9f1895",
      "claim_f5c22d02812194f9d8df13b4d7c3ec72",
      "claim_401c62c07a0647b8a318471d2de204d5",
      "claim_7bc1444acbdb454fd660b3f1881331d7",
      "claim_0f2924da178560767d4a7dc21e6227f0",
      "claim_4c9859c0447d4eb0ea46e885c1946494",
      "claim_0c1b99b0888721e4fa61beff6a7725ca",
      "claim_fad6a3c963e073b50db3575515628051",
      "claim_9a9d66f4e786b598282a64c085432a11",
      "claim_af639c0f4fe8f6c0dc329f1a1eb9c97b",
      "claim_45cb6ab722c2078e7a59c86715237268",
      "claim_8aaf2ab8cab3add036bfb158a244e225",
      "claim_bb1abedd6124e01311d47db329134ed2",
      "claim_bc98aa13763205eb00cee4cc4b098195",
      "claim_8c848adf5a592f82165f0d8961dcff9e",
      "claim_f6c28a9097619631e3c748472cb73eac",
      "claim_14051869225dc8365787e98bc34a696f",
      "claim_23f24412e9b7d9cd5e0d20ad7061b716",
      "claim_6cb105f8711384b40dda46a177f3232b",
      "claim_81ce7171216b0ab5c9fc1550cefc6517",
      "claim_7097b62d1adb6bbc723f2ba0b17dada2",
      "claim_6785a5f3a9f65744e05e4aaa247dd527",
      "claim_82aa2b5b7c4edb52f6c3419234feff1b"
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


## claim_0870894b58e3cf580c819f86aaf4aca9

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-60; lines 499–503; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-32; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: 56dd7eb62d06c283727cf88865d888ad8e0cb8d4d4b073794be71e2af4fc85bd
Target digest: 56dd7eb62d06c283727cf88865d888ad8e0cb8d4d4b073794be71e2af4fc85bd
Shown source SHA256: 56dd7eb62d06c283727cf88865d888ad8e0cb8d4d4b073794be71e2af4fc85bd
Shown target SHA256: 56dd7eb62d06c283727cf88865d888ad8e0cb8d4d4b073794be71e2af4fc85bd

### Complete proposed decision

```json
{
  "claimId": "claim_0870894b58e3cf580c819f86aaf4aca9",
  "sourceUnitDigest": "56dd7eb62d06c283727cf88865d888ad8e0cb8d4d4b073794be71e2af4fc85bd",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-60 (source lines 499-503) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-32 (candidate lines 312-316). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "56dd7eb62d06c283727cf88865d888ad8e0cb8d4d4b073794be71e2af4fc85bd",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
Project policy được coi là policy của người vận hành project đã tin cậy; nó có
thể yêu cầu bảo vệ cao hơn hoặc chọn `unconfined` một cách tường minh. Một repo
không tin cậy không được trở thành nguồn để giảm requirement của capability hoặc
thay machine registry. Nếu sản phẩm cần bảo vệ cả machine khỏi project config
độc hại, đó là trust profile riêng phải được thêm vào contract và backend.
```

### Full target shown text

```text
Project policy được coi là policy của người vận hành project đã tin cậy; nó có
thể yêu cầu bảo vệ cao hơn hoặc chọn `unconfined` một cách tường minh. Một repo
không tin cậy không được trở thành nguồn để giảm requirement của capability hoặc
thay machine registry. Nếu sản phẩm cần bảo vệ cả machine khỏi project config
độc hại, đó là trust profile riêng phải được thêm vào contract và backend.
```

## claim_c24cc4613c3ac072520ef666a443b1ba

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-61; lines 505–509; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-33; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: 5e9e62faae2fce40894b8d475702c842c54249bb1f25f3183a8584c4fb549ba4
Target digest: 5e9e62faae2fce40894b8d475702c842c54249bb1f25f3183a8584c4fb549ba4
Shown source SHA256: 5e9e62faae2fce40894b8d475702c842c54249bb1f25f3183a8584c4fb549ba4
Shown target SHA256: 5e9e62faae2fce40894b8d475702c842c54249bb1f25f3183a8584c4fb549ba4

### Complete proposed decision

```json
{
  "claimId": "claim_c24cc4613c3ac072520ef666a443b1ba",
  "sourceUnitDigest": "5e9e62faae2fce40894b8d475702c842c54249bb1f25f3183a8584c4fb549ba4",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-33",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-61 (source lines 505-509) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-33 (candidate lines 318-322). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5e9e62faae2fce40894b8d475702c842c54249bb1f25f3183a8584c4fb549ba4",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
Registry loader phải đọc và validate trọn document trước khi publish snapshot;
không dùng một phần registry khi một entry lỗi. Mỗi dispatch giữ một immutable
snapshot đến hết cleanup để config thay đổi giữa chừng không đổi backend đang
chạy. Default persistence có thể là file machine-local được setup quản lý;
contract không gắn caller với path của file đó.
```

### Full target shown text

```text
Registry loader phải đọc và validate trọn document trước khi publish snapshot;
không dùng một phần registry khi một entry lỗi. Mỗi dispatch giữ một immutable
snapshot đến hết cleanup để config thay đổi giữa chừng không đổi backend đang
chạy. Default persistence có thể là file machine-local được setup quản lý;
contract không gắn caller với path của file đó.
```

## claim_01eda8a43079cc517399ede91d3bb01f

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-62; lines 511–511; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-34; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: f74a150d52beabb3e5c3a6f2ebfbb7566a43287c85ae6d944b76c692925466cb
Target digest: f74a150d52beabb3e5c3a6f2ebfbb7566a43287c85ae6d944b76c692925466cb
Shown source SHA256: f74a150d52beabb3e5c3a6f2ebfbb7566a43287c85ae6d944b76c692925466cb
Shown target SHA256: f74a150d52beabb3e5c3a6f2ebfbb7566a43287c85ae6d944b76c692925466cb

### Complete proposed decision

```json
{
  "claimId": "claim_01eda8a43079cc517399ede91d3bb01f",
  "sourceUnitDigest": "f74a150d52beabb3e5c3a6f2ebfbb7566a43287c85ae6d944b76c692925466cb",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-34",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-62 (source lines 511-511) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-34 (candidate lines 324-324). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f74a150d52beabb3e5c3a6f2ebfbb7566a43287c85ae6d944b76c692925466cb",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
Resolution có thứ tự cố định:
```

### Full target shown text

```text
Resolution có thứ tự cố định:
```

## claim_c36cf0603526e446bd7db3af1dee79dd

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-63; lines 513–520; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-35; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: 88261031ef650f143ae4ba47fd8c1a7453082b83e92ceb8f25dd1174ccf52acf
Target digest: 88261031ef650f143ae4ba47fd8c1a7453082b83e92ceb8f25dd1174ccf52acf
Shown source SHA256: 88261031ef650f143ae4ba47fd8c1a7453082b83e92ceb8f25dd1174ccf52acf
Shown target SHA256: 88261031ef650f143ae4ba47fd8c1a7453082b83e92ceb8f25dd1174ccf52acf

### Complete proposed decision

```json
{
  "claimId": "claim_c36cf0603526e446bd7db3af1dee79dd",
  "sourceUnitDigest": "88261031ef650f143ae4ba47fd8c1a7453082b83e92ceb8f25dd1174ccf52acf",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-35",
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-63 (source lines 513-520) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-35 (candidate lines 326-333). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "88261031ef650f143ae4ba47fd8c1a7453082b83e92ceb8f25dd1174ccf52acf",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
1. Merge shared global/project config theo distribution contract.
2. Resolver chọn executor theo contract dispatch hiện có.
3. Đọc singular `executor.confinement.backend`.
4. Authority lookup đúng instance ID đó trong machine registry đã validate.
5. Registry nội bộ lookup driver bằng `instance.type`; đây là lookup type đã
   công bố trong schema, không phải routing key mà user phải đoán.
6. Driver kiểm tra host + instance config + request có cover policy hay không.
7. Authority execute hoặc refuse/degrade theo mode; không thử instance thứ hai.
```

### Full target shown text

```text
1. Merge shared global/project config theo distribution contract.
2. Resolver chọn executor theo contract dispatch hiện có.
3. Đọc singular `executor.confinement.backend`.
4. Authority lookup đúng instance ID đó trong machine registry đã validate.
5. Registry nội bộ lookup driver bằng `instance.type`; đây là lookup type đã
   công bố trong schema, không phải routing key mà user phải đoán.
6. Driver kiểm tra host + instance config + request có cover policy hay không.
7. Authority execute hoặc refuse/degrade theo mode; không thử instance thứ hai.
```

## claim_c5ea3072dec5e438ecb6ab8cb6940180

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-64; lines 522–524; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-36; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: c8b981d3fe9349795218066abe6fc97123368dc6b73b184748f04af9c504c574
Target digest: c8b981d3fe9349795218066abe6fc97123368dc6b73b184748f04af9c504c574
Shown source SHA256: c8b981d3fe9349795218066abe6fc97123368dc6b73b184748f04af9c504c574
Shown target SHA256: c8b981d3fe9349795218066abe6fc97123368dc6b73b184748f04af9c504c574

### Complete proposed decision

```json
{
  "claimId": "claim_c5ea3072dec5e438ecb6ab8cb6940180",
  "sourceUnitDigest": "c8b981d3fe9349795218066abe6fc97123368dc6b73b184748f04af9c504c574",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-36",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-64 (source lines 522-524) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-36 (candidate lines 335-337). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c8b981d3fe9349795218066abe6fc97123368dc6b73b184748f04af9c504c574",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
`enabled` mặc định là `true` khi entry tồn tại. Setup có thể tạo instance
`bwrap` thuận tiện trên machine hỗ trợ, nhưng đó chỉ là một entry có tên để
executor tham chiếu, không phải fallback/default selection rule.
```

### Full target shown text

```text
`enabled` mặc định là `true` khi entry tồn tại. Setup có thể tạo instance
`bwrap` thuận tiện trên machine hỗ trợ, nhưng đó chỉ là một entry có tên để
executor tham chiếu, không phải fallback/default selection rule.
```

## claim_f23b446a1760074a92c601a9f4613c04

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-65; lines 526–529; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-37; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: 0c228c628bd3d18adc97e83532fb52d588c5cee0d5835e6211155c37de3568fd
Target digest: 0c228c628bd3d18adc97e83532fb52d588c5cee0d5835e6211155c37de3568fd
Shown source SHA256: 0c228c628bd3d18adc97e83532fb52d588c5cee0d5835e6211155c37de3568fd
Shown target SHA256: 0c228c628bd3d18adc97e83532fb52d588c5cee0d5835e6211155c37de3568fd

### Complete proposed decision

```json
{
  "claimId": "claim_f23b446a1760074a92c601a9f4613c04",
  "sourceUnitDigest": "0c228c628bd3d18adc97e83532fb52d588c5cee0d5835e6211155c37de3568fd",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-37",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-65 (source lines 526-529) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-37 (candidate lines 339-342). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0c228c628bd3d18adc97e83532fb52d588c5cee0d5835e6211155c37de3568fd",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
Ba boolean `privateHome`, `isolatedSession`, `ownWorktree` hiện tại được
migrate thành các control tương ứng, không bị xóa nghĩa. Trong giai đoạn chuyển
tiếp, loader chấp nhận shape cũ, normalize thành policy v1 và cảnh báo nếu shape
cũ và mới mâu thuẫn.
```

### Full target shown text

```text
Ba boolean `privateHome`, `isolatedSession`, `ownWorktree` hiện tại được
migrate thành các control tương ứng, không bị xóa nghĩa. Trong giai đoạn chuyển
tiếp, loader chấp nhận shape cũ, normalize thành policy v1 và cảnh báo nếu shape
cũ và mới mâu thuẫn.
```

## claim_4f30adc11320bb5e798a8bc0db62f495

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-66; lines 531–536; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-38; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.2 Nơi đặt policy","6.2.1 Trust boundary của backend registry"].
Source digest: 08f5437a2edf680768899a27c79fe45abcb69a0fb79d53529243f812b1f788d5
Target digest: 08f5437a2edf680768899a27c79fe45abcb69a0fb79d53529243f812b1f788d5
Shown source SHA256: 08f5437a2edf680768899a27c79fe45abcb69a0fb79d53529243f812b1f788d5
Shown target SHA256: 08f5437a2edf680768899a27c79fe45abcb69a0fb79d53529243f812b1f788d5

### Complete proposed decision

```json
{
  "claimId": "claim_4f30adc11320bb5e798a8bc0db62f495",
  "sourceUnitDigest": "08f5437a2edf680768899a27c79fe45abcb69a0fb79d53529243f812b1f788d5",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-38",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-66 (source lines 531-536) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-38 (candidate lines 344-349). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "08f5437a2edf680768899a27c79fe45abcb69a0fb79d53529243f812b1f788d5",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.2 Nơi đặt policy",
    "6.2.1 Trust boundary của backend registry"
  ]
}
```

### Full source shown text

```text
Legacy permissionMode bypass vẫn yêu cầu privateHome, isolatedSession,
ownWorktree như validator hiện tại: normalize thành home private, session
isolated, workspace own và verify đầy đủ trước execute. hostWrite deny không
thay thế ba điều kiện này; default chưa hỗ trợ đủ thì refuse. Không suy bypass
từ argv provider để tự nới invariant. Mâu thuẫn legacy/new policy là config
error, warning không đủ nếu chọn một phía làm mất bảo vệ.
```

### Full target shown text

```text
Legacy permissionMode bypass vẫn yêu cầu privateHome, isolatedSession,
ownWorktree như validator hiện tại: normalize thành home private, session
isolated, workspace own và verify đầy đủ trước execute. hostWrite deny không
thay thế ba điều kiện này; default chưa hỗ trợ đủ thì refuse. Không suy bypass
từ argv provider để tự nới invariant. Mâu thuẫn legacy/new policy là config
error, warning không đủ nếu chọn một phía làm mất bảo vệ.
```

## claim_cac60d0f1164309f87ede7041b9f1895

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#63-confinementrequest; lines 538–538; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#63-confinementrequest; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: f72908db532eea1fabf7ca2802a34a2e95ec81bc49b1f220c182f25a8a75a8f3
Target digest: f72908db532eea1fabf7ca2802a34a2e95ec81bc49b1f220c182f25a8a75a8f3
Shown source SHA256: 4d16cb36a649524e305adc1a7e029390faa6a04f8afe6cea4311deca1bf09480
Shown target SHA256: 4d16cb36a649524e305adc1a7e029390faa6a04f8afe6cea4311deca1bf09480

### Complete proposed decision

```json
{
  "claimId": "claim_cac60d0f1164309f87ede7041b9f1895",
  "sourceUnitDigest": "f72908db532eea1fabf7ca2802a34a2e95ec81bc49b1f220c182f25a8a75a8f3",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "63-confinementrequest",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#63-confinementrequest (source lines 538-538) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#63-confinementrequest (candidate lines 351-351). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "f72908db532eea1fabf7ca2802a34a2e95ec81bc49b1f220c182f25a8a75a8f3",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

````text
### 6.3 `ConfinementRequest`

Request là snapshot đầy đủ tại cửa runtime:

```ts
interface RuntimeResourceBindingV1 {
  resource: string;
  target:
    | { kind: 'env'; name: string }
    | { kind: 'argument'; token: string };
}

interface RuntimeResourceNeedV1 {
  resource: string;
  access: 'read' | 'write' | 'read-write';
}

interface ResourceResolverV1 {
  resolve(
    resource: string,
    context: ConfinementRequestV1['context'],
    providerSources: Readonly<Record<string, string>>,
  ): { identity: string; hostTargets: string[]; allocation: 'existing' | 'temporary' };
}

interface ResolvedResourceV1 {
  resource: string;
  identity: string;
  hostTarget: string | null;
  executionTarget: { location: 'host' | 'container' | 'remote'; path: string };
  delivery: 'direct' | 'mount' | 'copy';
  collect: 'none' | 'artifact' | 'workspace-change';
}

interface ConfinementRequestV1 {
  contract: 'confinement-request.v1';
  dispatchId: string;
  capability: string;
  executorId: string;
  invocation: {
    command: string;
    args: string[];
    env: Record<string, string>;
    adapter: string;
    resourceBindings: RuntimeResourceBindingV1[];
    // Remote adapter dùng transport, không spawn command/args.
    transport?: { kind: 'http'; method: string; url: string;
      headers: Record<string, string>; body?: string };
  };
  context: {
    cwd: string;
    repoRoot?: string;
    runDir: string;
    fgosDir?: string;
  };
  requirement: ResolvedConfinementRequirementV1;
  override?: InvocationConfinementOverrideV1;
  resourceNeeds: RuntimeResourceNeedV1[];
  backendId: string | null;
}
```

Mọi path phải absolute sau normalize. `runDir` bắt buộc với dispatch agent;
không backend nào được tự suy nó từ `.fgos/assignments` hay current working
directory. Request không chứa backend type hay raw backend config. Authority là
bên duy nhất resolve `backendId` từ machine registry, tránh để caller tiêm một
deployment config khác vào đúng cửa enforcement.

Mỗi binding phải tham chiếu resource được policy cho phép. `token` là placeholder
opaque đã có trong argv, không phải path. Authority/backend thay binding bằng
resolved target trong phase prepare; binding thừa, trùng target hoặc không có
grant tương ứng là `confinement-grant-invalid`.
`override` chỉ xuất hiện sau khi resolver đã kiểm tra
`allowInvocationOverride`; Authority vẫn validate lại partial order tại cửa
runtime.

`context` chứa path phía host. Authority resolve resource identity/host target;
driver đề xuất execution target và delivery bằng bước assessment không side
effect, Authority validate rồi đóng băng vào plan. Binding được materialize
bằng execution target, không dùng host path trên máy remote. Với copy, prepare
stage input trước spawn; sau execution phải collect output trước cleanup.
Workspace-change chỉ thu về artifact/patch, không tự ghi đè workspace host.
Collect thất bại là failed và giữ resource để recovery; backend không hỗ trợ
delivery/collect cần thiết phải refuse. Namespace và target phải thuộc dispatch,
không chấp nhận path/handle do agent tự khai là bằng chứng ownership.

`resourceNeeds` do provider normalizer diễn tả nhu cầu vận hành, không cấp quyền.
Mỗi need phải nằm trong grant tương ứng; mỗi binding phải có need tương ứng.
Run-output write là need bắt buộc của dispatch; private-home read-write là need
khi home private. Needs thiếu tài nguyên hoặc quyền thì refuse ở mọi mode.
Unconfined không so needs với policy null, nhưng vẫn validate target và delivery.

Authority sở hữu ResourceResolverV1 và validate output. run-output lấy từ runDir;
workspace lấy root workspace đã được dispatch xác nhận (không mặc định mọi cwd
là root); private-home nhận allocation identity từ backend temp-root config;
executor-credentials lấy path/reference từ provider normalizer tin cậy dùng
distribution resolver, không hardcode home hay nhận path do prompt cấp. Một
resource có nhiều hostTargets được expand thành nhiều ResolvedResourceV1 cùng
resource, khác identity; coverage resource là tổng hợp tất cả target.

Workspace worktree phải resolve .git bằng Git metadata, không đoán path bằng
chuỗi. workspace-git-metadata gồm per-worktree gitdir đã kiểm ownership;
common gitdir objects/refs có thể cần cho commit và là shared state, không tự
grant toàn common dir hoặc parent checkout. Readiness cho nhu cầu Git write
chỉ đạt khi backend có mapping hẹp đã probe, hoặc dùng isolated git storage.
Nếu chưa có, sửa file vẫn được nhưng nhu cầu commit phải refuse. Default test
phải chứng minh không sửa metadata worktree khác; hỗ trợ workspace-write không
đồng nghĩa mọi thao tác git/merge đều được cấp quyền.
````

### Full target shown text

````text
### 6.3 `ConfinementRequest`

Request là snapshot đầy đủ tại cửa runtime:

```ts
interface RuntimeResourceBindingV1 {
  resource: string;
  target:
    | { kind: 'env'; name: string }
    | { kind: 'argument'; token: string };
}

interface RuntimeResourceNeedV1 {
  resource: string;
  access: 'read' | 'write' | 'read-write';
}

interface ResourceResolverV1 {
  resolve(
    resource: string,
    context: ConfinementRequestV1['context'],
    providerSources: Readonly<Record<string, string>>,
  ): { identity: string; hostTargets: string[]; allocation: 'existing' | 'temporary' };
}

interface ResolvedResourceV1 {
  resource: string;
  identity: string;
  hostTarget: string | null;
  executionTarget: { location: 'host' | 'container' | 'remote'; path: string };
  delivery: 'direct' | 'mount' | 'copy';
  collect: 'none' | 'artifact' | 'workspace-change';
}

interface ConfinementRequestV1 {
  contract: 'confinement-request.v1';
  dispatchId: string;
  capability: string;
  executorId: string;
  invocation: {
    command: string;
    args: string[];
    env: Record<string, string>;
    adapter: string;
    resourceBindings: RuntimeResourceBindingV1[];
    // Remote adapter dùng transport, không spawn command/args.
    transport?: { kind: 'http'; method: string; url: string;
      headers: Record<string, string>; body?: string };
  };
  context: {
    cwd: string;
    repoRoot?: string;
    runDir: string;
    fgosDir?: string;
  };
  requirement: ResolvedConfinementRequirementV1;
  override?: InvocationConfinementOverrideV1;
  resourceNeeds: RuntimeResourceNeedV1[];
  backendId: string | null;
}
```

Mọi path phải absolute sau normalize. `runDir` bắt buộc với dispatch agent;
không backend nào được tự suy nó từ `.fgos/assignments` hay current working
directory. Request không chứa backend type hay raw backend config. Authority là
bên duy nhất resolve `backendId` từ machine registry, tránh để caller tiêm một
deployment config khác vào đúng cửa enforcement.

Mỗi binding phải tham chiếu resource được policy cho phép. `token` là placeholder
opaque đã có trong argv, không phải path. Authority/backend thay binding bằng
resolved target trong phase prepare; binding thừa, trùng target hoặc không có
grant tương ứng là `confinement-grant-invalid`.
`override` chỉ xuất hiện sau khi resolver đã kiểm tra
`allowInvocationOverride`; Authority vẫn validate lại partial order tại cửa
runtime.

`context` chứa path phía host. Authority resolve resource identity/host target;
driver đề xuất execution target và delivery bằng bước assessment không side
effect, Authority validate rồi đóng băng vào plan. Binding được materialize
bằng execution target, không dùng host path trên máy remote. Với copy, prepare
stage input trước spawn; sau execution phải collect output trước cleanup.
Workspace-change chỉ thu về artifact/patch, không tự ghi đè workspace host.
Collect thất bại là failed và giữ resource để recovery; backend không hỗ trợ
delivery/collect cần thiết phải refuse. Namespace và target phải thuộc dispatch,
không chấp nhận path/handle do agent tự khai là bằng chứng ownership.

`resourceNeeds` do provider normalizer diễn tả nhu cầu vận hành, không cấp quyền.
Mỗi need phải nằm trong grant tương ứng; mỗi binding phải có need tương ứng.
Run-output write là need bắt buộc của dispatch; private-home read-write là need
khi home private. Needs thiếu tài nguyên hoặc quyền thì refuse ở mọi mode.
Unconfined không so needs với policy null, nhưng vẫn validate target và delivery.

Authority sở hữu ResourceResolverV1 và validate output. run-output lấy từ runDir;
workspace lấy root workspace đã được dispatch xác nhận (không mặc định mọi cwd
là root); private-home nhận allocation identity từ backend temp-root config;
executor-credentials lấy path/reference từ provider normalizer tin cậy dùng
distribution resolver, không hardcode home hay nhận path do prompt cấp. Một
resource có nhiều hostTargets được expand thành nhiều ResolvedResourceV1 cùng
resource, khác identity; coverage resource là tổng hợp tất cả target.

Workspace worktree phải resolve .git bằng Git metadata, không đoán path bằng
chuỗi. workspace-git-metadata gồm per-worktree gitdir đã kiểm ownership;
common gitdir objects/refs có thể cần cho commit và là shared state, không tự
grant toàn common dir hoặc parent checkout. Readiness cho nhu cầu Git write
chỉ đạt khi backend có mapping hẹp đã probe, hoặc dùng isolated git storage.
Nếu chưa có, sửa file vẫn được nhưng nhu cầu commit phải refuse. Default test
phải chứng minh không sửa metadata worktree khác; hỗ trợ workspace-write không
đồng nghĩa mọi thao tác git/merge đều được cấp quyền.
````

## claim_f5c22d02812194f9d8df13b4d7c3ec72

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-67; lines 540–540; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-39; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: 243f9c7a472a472994fb186884a60bba0663fa2a88ca22ec227b73d82a8a8379
Target digest: 243f9c7a472a472994fb186884a60bba0663fa2a88ca22ec227b73d82a8a8379
Shown source SHA256: 243f9c7a472a472994fb186884a60bba0663fa2a88ca22ec227b73d82a8a8379
Shown target SHA256: 243f9c7a472a472994fb186884a60bba0663fa2a88ca22ec227b73d82a8a8379

### Complete proposed decision

```json
{
  "claimId": "claim_f5c22d02812194f9d8df13b4d7c3ec72",
  "sourceUnitDigest": "243f9c7a472a472994fb186884a60bba0663fa2a88ca22ec227b73d82a8a8379",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-39",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-67 (source lines 540-540) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-39 (candidate lines 353-353). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "243f9c7a472a472994fb186884a60bba0663fa2a88ca22ec227b73d82a8a8379",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
Request là snapshot đầy đủ tại cửa runtime:
```

### Full target shown text

```text
Request là snapshot đầy đủ tại cửa runtime:
```

## claim_401c62c07a0647b8a318471d2de204d5

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-68; lines 542–598; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-40; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: fa9f2bd13fb1ceab92b04aac0394bf0eb56a399fe887087f5d8e44483f16d590
Target digest: fa9f2bd13fb1ceab92b04aac0394bf0eb56a399fe887087f5d8e44483f16d590
Shown source SHA256: fa9f2bd13fb1ceab92b04aac0394bf0eb56a399fe887087f5d8e44483f16d590
Shown target SHA256: fa9f2bd13fb1ceab92b04aac0394bf0eb56a399fe887087f5d8e44483f16d590

### Complete proposed decision

```json
{
  "claimId": "claim_401c62c07a0647b8a318471d2de204d5",
  "sourceUnitDigest": "fa9f2bd13fb1ceab92b04aac0394bf0eb56a399fe887087f5d8e44483f16d590",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-40",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-68 (source lines 542-598) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-40 (candidate lines 355-411). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "fa9f2bd13fb1ceab92b04aac0394bf0eb56a399fe887087f5d8e44483f16d590",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

````text
```ts
interface RuntimeResourceBindingV1 {
  resource: string;
  target:
    | { kind: 'env'; name: string }
    | { kind: 'argument'; token: string };
}

interface RuntimeResourceNeedV1 {
  resource: string;
  access: 'read' | 'write' | 'read-write';
}

interface ResourceResolverV1 {
  resolve(
    resource: string,
    context: ConfinementRequestV1['context'],
    providerSources: Readonly<Record<string, string>>,
  ): { identity: string; hostTargets: string[]; allocation: 'existing' | 'temporary' };
}

interface ResolvedResourceV1 {
  resource: string;
  identity: string;
  hostTarget: string | null;
  executionTarget: { location: 'host' | 'container' | 'remote'; path: string };
  delivery: 'direct' | 'mount' | 'copy';
  collect: 'none' | 'artifact' | 'workspace-change';
}

interface ConfinementRequestV1 {
  contract: 'confinement-request.v1';
  dispatchId: string;
  capability: string;
  executorId: string;
  invocation: {
    command: string;
    args: string[];
    env: Record<string, string>;
    adapter: string;
    resourceBindings: RuntimeResourceBindingV1[];
    // Remote adapter dùng transport, không spawn command/args.
    transport?: { kind: 'http'; method: string; url: string;
      headers: Record<string, string>; body?: string };
  };
  context: {
    cwd: string;
    repoRoot?: string;
    runDir: string;
    fgosDir?: string;
  };
  requirement: ResolvedConfinementRequirementV1;
  override?: InvocationConfinementOverrideV1;
  resourceNeeds: RuntimeResourceNeedV1[];
  backendId: string | null;
}
```
````

### Full target shown text

````text
```ts
interface RuntimeResourceBindingV1 {
  resource: string;
  target:
    | { kind: 'env'; name: string }
    | { kind: 'argument'; token: string };
}

interface RuntimeResourceNeedV1 {
  resource: string;
  access: 'read' | 'write' | 'read-write';
}

interface ResourceResolverV1 {
  resolve(
    resource: string,
    context: ConfinementRequestV1['context'],
    providerSources: Readonly<Record<string, string>>,
  ): { identity: string; hostTargets: string[]; allocation: 'existing' | 'temporary' };
}

interface ResolvedResourceV1 {
  resource: string;
  identity: string;
  hostTarget: string | null;
  executionTarget: { location: 'host' | 'container' | 'remote'; path: string };
  delivery: 'direct' | 'mount' | 'copy';
  collect: 'none' | 'artifact' | 'workspace-change';
}

interface ConfinementRequestV1 {
  contract: 'confinement-request.v1';
  dispatchId: string;
  capability: string;
  executorId: string;
  invocation: {
    command: string;
    args: string[];
    env: Record<string, string>;
    adapter: string;
    resourceBindings: RuntimeResourceBindingV1[];
    // Remote adapter dùng transport, không spawn command/args.
    transport?: { kind: 'http'; method: string; url: string;
      headers: Record<string, string>; body?: string };
  };
  context: {
    cwd: string;
    repoRoot?: string;
    runDir: string;
    fgosDir?: string;
  };
  requirement: ResolvedConfinementRequirementV1;
  override?: InvocationConfinementOverrideV1;
  resourceNeeds: RuntimeResourceNeedV1[];
  backendId: string | null;
}
```
````

## claim_7bc1444acbdb454fd660b3f1881331d7

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-69; lines 600–604; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-41; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: 93e2804980576701a4a72931a954008cf6bdd673e36939d85ef2414581623855
Target digest: 93e2804980576701a4a72931a954008cf6bdd673e36939d85ef2414581623855
Shown source SHA256: 93e2804980576701a4a72931a954008cf6bdd673e36939d85ef2414581623855
Shown target SHA256: 93e2804980576701a4a72931a954008cf6bdd673e36939d85ef2414581623855

### Complete proposed decision

```json
{
  "claimId": "claim_7bc1444acbdb454fd660b3f1881331d7",
  "sourceUnitDigest": "93e2804980576701a4a72931a954008cf6bdd673e36939d85ef2414581623855",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-41",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-69 (source lines 600-604) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-41 (candidate lines 413-417). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "93e2804980576701a4a72931a954008cf6bdd673e36939d85ef2414581623855",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
Mọi path phải absolute sau normalize. `runDir` bắt buộc với dispatch agent;
không backend nào được tự suy nó từ `.fgos/assignments` hay current working
directory. Request không chứa backend type hay raw backend config. Authority là
bên duy nhất resolve `backendId` từ machine registry, tránh để caller tiêm một
deployment config khác vào đúng cửa enforcement.
```

### Full target shown text

```text
Mọi path phải absolute sau normalize. `runDir` bắt buộc với dispatch agent;
không backend nào được tự suy nó từ `.fgos/assignments` hay current working
directory. Request không chứa backend type hay raw backend config. Authority là
bên duy nhất resolve `backendId` từ machine registry, tránh để caller tiêm một
deployment config khác vào đúng cửa enforcement.
```

## claim_0f2924da178560767d4a7dc21e6227f0

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-70; lines 606–612; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-42; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: d25458887a8603d248604aaf1ef55ca94fc14a5dbea5d5631db83950840ec492
Target digest: d25458887a8603d248604aaf1ef55ca94fc14a5dbea5d5631db83950840ec492
Shown source SHA256: d25458887a8603d248604aaf1ef55ca94fc14a5dbea5d5631db83950840ec492
Shown target SHA256: d25458887a8603d248604aaf1ef55ca94fc14a5dbea5d5631db83950840ec492

### Complete proposed decision

```json
{
  "claimId": "claim_0f2924da178560767d4a7dc21e6227f0",
  "sourceUnitDigest": "d25458887a8603d248604aaf1ef55ca94fc14a5dbea5d5631db83950840ec492",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-42",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-70 (source lines 606-612) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-42 (candidate lines 419-425). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "d25458887a8603d248604aaf1ef55ca94fc14a5dbea5d5631db83950840ec492",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
Mỗi binding phải tham chiếu resource được policy cho phép. `token` là placeholder
opaque đã có trong argv, không phải path. Authority/backend thay binding bằng
resolved target trong phase prepare; binding thừa, trùng target hoặc không có
grant tương ứng là `confinement-grant-invalid`.
`override` chỉ xuất hiện sau khi resolver đã kiểm tra
`allowInvocationOverride`; Authority vẫn validate lại partial order tại cửa
runtime.
```

### Full target shown text

```text
Mỗi binding phải tham chiếu resource được policy cho phép. `token` là placeholder
opaque đã có trong argv, không phải path. Authority/backend thay binding bằng
resolved target trong phase prepare; binding thừa, trùng target hoặc không có
grant tương ứng là `confinement-grant-invalid`.
`override` chỉ xuất hiện sau khi resolver đã kiểm tra
`allowInvocationOverride`; Authority vẫn validate lại partial order tại cửa
runtime.
```

## claim_4c9859c0447d4eb0ea46e885c1946494

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-71; lines 614–622; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-43; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: bc442418deabb38062109ee413f6cdbce852c513665fb09388458180787834e0
Target digest: bc442418deabb38062109ee413f6cdbce852c513665fb09388458180787834e0
Shown source SHA256: bc442418deabb38062109ee413f6cdbce852c513665fb09388458180787834e0
Shown target SHA256: bc442418deabb38062109ee413f6cdbce852c513665fb09388458180787834e0

### Complete proposed decision

```json
{
  "claimId": "claim_4c9859c0447d4eb0ea46e885c1946494",
  "sourceUnitDigest": "bc442418deabb38062109ee413f6cdbce852c513665fb09388458180787834e0",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-43",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-71 (source lines 614-622) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-43 (candidate lines 427-435). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bc442418deabb38062109ee413f6cdbce852c513665fb09388458180787834e0",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
`context` chứa path phía host. Authority resolve resource identity/host target;
driver đề xuất execution target và delivery bằng bước assessment không side
effect, Authority validate rồi đóng băng vào plan. Binding được materialize
bằng execution target, không dùng host path trên máy remote. Với copy, prepare
stage input trước spawn; sau execution phải collect output trước cleanup.
Workspace-change chỉ thu về artifact/patch, không tự ghi đè workspace host.
Collect thất bại là failed và giữ resource để recovery; backend không hỗ trợ
delivery/collect cần thiết phải refuse. Namespace và target phải thuộc dispatch,
không chấp nhận path/handle do agent tự khai là bằng chứng ownership.
```

### Full target shown text

```text
`context` chứa path phía host. Authority resolve resource identity/host target;
driver đề xuất execution target và delivery bằng bước assessment không side
effect, Authority validate rồi đóng băng vào plan. Binding được materialize
bằng execution target, không dùng host path trên máy remote. Với copy, prepare
stage input trước spawn; sau execution phải collect output trước cleanup.
Workspace-change chỉ thu về artifact/patch, không tự ghi đè workspace host.
Collect thất bại là failed và giữ resource để recovery; backend không hỗ trợ
delivery/collect cần thiết phải refuse. Namespace và target phải thuộc dispatch,
không chấp nhận path/handle do agent tự khai là bằng chứng ownership.
```

## claim_0c1b99b0888721e4fa61beff6a7725ca

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-72; lines 624–628; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-44; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: 0b3fe05e83b37073480e24dad16055a7cf52ca7997ad4d1d2a4a8aec05587a1f
Target digest: 0b3fe05e83b37073480e24dad16055a7cf52ca7997ad4d1d2a4a8aec05587a1f
Shown source SHA256: 0b3fe05e83b37073480e24dad16055a7cf52ca7997ad4d1d2a4a8aec05587a1f
Shown target SHA256: 0b3fe05e83b37073480e24dad16055a7cf52ca7997ad4d1d2a4a8aec05587a1f

### Complete proposed decision

```json
{
  "claimId": "claim_0c1b99b0888721e4fa61beff6a7725ca",
  "sourceUnitDigest": "0b3fe05e83b37073480e24dad16055a7cf52ca7997ad4d1d2a4a8aec05587a1f",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-44",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-72 (source lines 624-628) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-44 (candidate lines 437-441). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "0b3fe05e83b37073480e24dad16055a7cf52ca7997ad4d1d2a4a8aec05587a1f",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
`resourceNeeds` do provider normalizer diễn tả nhu cầu vận hành, không cấp quyền.
Mỗi need phải nằm trong grant tương ứng; mỗi binding phải có need tương ứng.
Run-output write là need bắt buộc của dispatch; private-home read-write là need
khi home private. Needs thiếu tài nguyên hoặc quyền thì refuse ở mọi mode.
Unconfined không so needs với policy null, nhưng vẫn validate target và delivery.
```

### Full target shown text

```text
`resourceNeeds` do provider normalizer diễn tả nhu cầu vận hành, không cấp quyền.
Mỗi need phải nằm trong grant tương ứng; mỗi binding phải có need tương ứng.
Run-output write là need bắt buộc của dispatch; private-home read-write là need
khi home private. Needs thiếu tài nguyên hoặc quyền thì refuse ở mọi mode.
Unconfined không so needs với policy null, nhưng vẫn validate target và delivery.
```

## claim_fad6a3c963e073b50db3575515628051

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-73; lines 630–636; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-45; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: 781ad161936829706a9cb0681013fd165c5c218f7e4b509f617c3035147d06e6
Target digest: 781ad161936829706a9cb0681013fd165c5c218f7e4b509f617c3035147d06e6
Shown source SHA256: 781ad161936829706a9cb0681013fd165c5c218f7e4b509f617c3035147d06e6
Shown target SHA256: 781ad161936829706a9cb0681013fd165c5c218f7e4b509f617c3035147d06e6

### Complete proposed decision

```json
{
  "claimId": "claim_fad6a3c963e073b50db3575515628051",
  "sourceUnitDigest": "781ad161936829706a9cb0681013fd165c5c218f7e4b509f617c3035147d06e6",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-45",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-73 (source lines 630-636) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-45 (candidate lines 443-449). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "781ad161936829706a9cb0681013fd165c5c218f7e4b509f617c3035147d06e6",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
Authority sở hữu ResourceResolverV1 và validate output. run-output lấy từ runDir;
workspace lấy root workspace đã được dispatch xác nhận (không mặc định mọi cwd
là root); private-home nhận allocation identity từ backend temp-root config;
executor-credentials lấy path/reference từ provider normalizer tin cậy dùng
distribution resolver, không hardcode home hay nhận path do prompt cấp. Một
resource có nhiều hostTargets được expand thành nhiều ResolvedResourceV1 cùng
resource, khác identity; coverage resource là tổng hợp tất cả target.
```

### Full target shown text

```text
Authority sở hữu ResourceResolverV1 và validate output. run-output lấy từ runDir;
workspace lấy root workspace đã được dispatch xác nhận (không mặc định mọi cwd
là root); private-home nhận allocation identity từ backend temp-root config;
executor-credentials lấy path/reference từ provider normalizer tin cậy dùng
distribution resolver, không hardcode home hay nhận path do prompt cấp. Một
resource có nhiều hostTargets được expand thành nhiều ResolvedResourceV1 cùng
resource, khác identity; coverage resource là tổng hợp tất cả target.
```

## claim_9a9d66f4e786b598282a64c085432a11

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-74; lines 638–645; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.3 `ConfinementRequest`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-46; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.3 `ConfinementRequest`"].
Source digest: 21f17ef9f28dce5a128ccff3b509f4f1ef314f516665c113fc072cd78ea5c343
Target digest: 21f17ef9f28dce5a128ccff3b509f4f1ef314f516665c113fc072cd78ea5c343
Shown source SHA256: 21f17ef9f28dce5a128ccff3b509f4f1ef314f516665c113fc072cd78ea5c343
Shown target SHA256: 21f17ef9f28dce5a128ccff3b509f4f1ef314f516665c113fc072cd78ea5c343

### Complete proposed decision

```json
{
  "claimId": "claim_9a9d66f4e786b598282a64c085432a11",
  "sourceUnitDigest": "21f17ef9f28dce5a128ccff3b509f4f1ef314f516665c113fc072cd78ea5c343",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-46",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-74 (source lines 638-645) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-46 (candidate lines 451-458). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "21f17ef9f28dce5a128ccff3b509f4f1ef314f516665c113fc072cd78ea5c343",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.3 `ConfinementRequest`"
  ]
}
```

### Full source shown text

```text
Workspace worktree phải resolve .git bằng Git metadata, không đoán path bằng
chuỗi. workspace-git-metadata gồm per-worktree gitdir đã kiểm ownership;
common gitdir objects/refs có thể cần cho commit và là shared state, không tự
grant toàn common dir hoặc parent checkout. Readiness cho nhu cầu Git write
chỉ đạt khi backend có mapping hẹp đã probe, hoặc dùng isolated git storage.
Nếu chưa có, sửa file vẫn được nhưng nhu cầu commit phải refuse. Default test
phải chứng minh không sửa metadata worktree khác; hỗ trợ workspace-write không
đồng nghĩa mọi thao tác git/merge đều được cấp quyền.
```

### Full target shown text

```text
Workspace worktree phải resolve .git bằng Git metadata, không đoán path bằng
chuỗi. workspace-git-metadata gồm per-worktree gitdir đã kiểm ownership;
common gitdir objects/refs có thể cần cho commit và là shared state, không tự
grant toàn common dir hoặc parent checkout. Readiness cho nhu cầu Git write
chỉ đạt khi backend có mapping hẹp đã probe, hoặc dùng isolated git storage.
Nếu chưa có, sửa file vẫn được nhưng nhu cầu commit phải refuse. Default test
phải chứng minh không sửa metadata worktree khác; hỗ trợ workspace-write không
đồng nghĩa mọi thao tác git/merge đều được cấp quyền.
```

## claim_af639c0f4fe8f6c0dc329f1a1eb9c97b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#64-confinementplan; lines 647–647; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#64-confinementplan; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: 8928a0f81055cbe7077d99e75a47b1514fea1b6461e357cbbd48b056a2b9a864
Target digest: 8928a0f81055cbe7077d99e75a47b1514fea1b6461e357cbbd48b056a2b9a864
Shown source SHA256: 2214a37c68469590ea8d38f20a49f43f5a2a5b5714884caac3bd0331406b240a
Shown target SHA256: 2214a37c68469590ea8d38f20a49f43f5a2a5b5714884caac3bd0331406b240a

### Complete proposed decision

```json
{
  "claimId": "claim_af639c0f4fe8f6c0dc329f1a1eb9c97b",
  "sourceUnitDigest": "8928a0f81055cbe7077d99e75a47b1514fea1b6461e357cbbd48b056a2b9a864",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "64-confinementplan",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#64-confinementplan (source lines 647-647) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#64-confinementplan (candidate lines 460-460). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "8928a0f81055cbe7077d99e75a47b1514fea1b6461e357cbbd48b056a2b9a864",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

````text
### 6.4 `ConfinementPlan`

Compile plan là pure trên request và assessment snapshot đã resolve; kết quả
serializable, audit được trước side effect prepare (không phủ nhận I/O resolve):

```ts
interface ConfinementPlanV1 {
  contract: 'confinement-plan.v1';
  dispatchId: string;
  decision: 'execute' | 'refuse' | 'degrade';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  grants: Array<{
    resource: string;
    access: string;
    resolvedTarget: string;
  }>;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  mismatches: Array<{ code: string; detail: string }>;
}
```

Plan không chứa credential value. `resolvedTarget` có thể bị redact trong event
public, nhưng run record cục bộ phải đủ thông tin để audit grant.
`grants[].resolvedTarget` là executionTarget.path của entry cùng resource trong
resources; identity/location nằm ở resources, không suy từ string path.

`required` cộng bất kỳ control nào `unsatisfied|unknown` dẫn tới
`refuse`; grant optional không resolve là ngoại lệ hẹp: nó là `unverified`
nhưng không mismatch. `preferred` có thể dẫn tới `degrade`, nhưng phải có mismatch và
attestation. `coverage` phải có entry cho toàn bộ control và grant trong
`requested.policy`; thiếu entry là `unknown` và bị từ chối trong `required`.
Không có degrade âm thầm.

Coverage dùng key `control:<name>` và `grant:<resource>`, mỗi resource chỉ có
một grant. Grant coverage satisfied nghĩa là quyền thực tế không vượt giới hạn,
không có nghĩa đủ quyền chạy việc. Readiness dùng key resource từ resourceNeeds:
satisfied khi nhu cầu thực thi được cấp đủ. Readiness unsatisfied/unknown luôn
refuse, kể cả preferred. Backend cấp read cho grant read-write vẫn có thể đạt
coverage, nhưng need write sẽ không đạt readiness. Grant là exception của deny;
khi trục hostRead/hostWrite là allow, grant không tạo deny ngầm trên trục đó.
````

### Full target shown text

````text
### 6.4 `ConfinementPlan`

Compile plan là pure trên request và assessment snapshot đã resolve; kết quả
serializable, audit được trước side effect prepare (không phủ nhận I/O resolve):

```ts
interface ConfinementPlanV1 {
  contract: 'confinement-plan.v1';
  dispatchId: string;
  decision: 'execute' | 'refuse' | 'degrade';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  grants: Array<{
    resource: string;
    access: string;
    resolvedTarget: string;
  }>;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  mismatches: Array<{ code: string; detail: string }>;
}
```

Plan không chứa credential value. `resolvedTarget` có thể bị redact trong event
public, nhưng run record cục bộ phải đủ thông tin để audit grant.
`grants[].resolvedTarget` là executionTarget.path của entry cùng resource trong
resources; identity/location nằm ở resources, không suy từ string path.

`required` cộng bất kỳ control nào `unsatisfied|unknown` dẫn tới
`refuse`; grant optional không resolve là ngoại lệ hẹp: nó là `unverified`
nhưng không mismatch. `preferred` có thể dẫn tới `degrade`, nhưng phải có mismatch và
attestation. `coverage` phải có entry cho toàn bộ control và grant trong
`requested.policy`; thiếu entry là `unknown` và bị từ chối trong `required`.
Không có degrade âm thầm.

Coverage dùng key `control:<name>` và `grant:<resource>`, mỗi resource chỉ có
một grant. Grant coverage satisfied nghĩa là quyền thực tế không vượt giới hạn,
không có nghĩa đủ quyền chạy việc. Readiness dùng key resource từ resourceNeeds:
satisfied khi nhu cầu thực thi được cấp đủ. Readiness unsatisfied/unknown luôn
refuse, kể cả preferred. Backend cấp read cho grant read-write vẫn có thể đạt
coverage, nhưng need write sẽ không đạt readiness. Grant là exception của deny;
khi trục hostRead/hostWrite là allow, grant không tạo deny ngầm trên trục đó.
````

## claim_45cb6ab722c2078e7a59c86715237268

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-75; lines 649–650; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.4 `ConfinementPlan`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-47; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.4 `ConfinementPlan`"].
Source digest: 5eafc3ef3beffaecc2bacf329d0b69051d295685302d9410ef256ccef5f2392b
Target digest: 5eafc3ef3beffaecc2bacf329d0b69051d295685302d9410ef256ccef5f2392b
Shown source SHA256: 5eafc3ef3beffaecc2bacf329d0b69051d295685302d9410ef256ccef5f2392b
Shown target SHA256: 5eafc3ef3beffaecc2bacf329d0b69051d295685302d9410ef256ccef5f2392b

### Complete proposed decision

```json
{
  "claimId": "claim_45cb6ab722c2078e7a59c86715237268",
  "sourceUnitDigest": "5eafc3ef3beffaecc2bacf329d0b69051d295685302d9410ef256ccef5f2392b",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-47",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-75 (source lines 649-650) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-47 (candidate lines 462-463). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "5eafc3ef3beffaecc2bacf329d0b69051d295685302d9410ef256ccef5f2392b",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.4 `ConfinementPlan`"
  ]
}
```

### Full source shown text

```text
Compile plan là pure trên request và assessment snapshot đã resolve; kết quả
serializable, audit được trước side effect prepare (không phủ nhận I/O resolve):
```

### Full target shown text

```text
Compile plan là pure trên request và assessment snapshot đã resolve; kết quả
serializable, audit được trước side effect prepare (không phủ nhận I/O resolve):
```

## claim_8aaf2ab8cab3add036bfb158a244e225

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-76; lines 652–674; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.4 `ConfinementPlan`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-48; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.4 `ConfinementPlan`"].
Source digest: 69dceaac752e861a29e869a905561a77730ad654a1447daf35ae69028dcf12c3
Target digest: 69dceaac752e861a29e869a905561a77730ad654a1447daf35ae69028dcf12c3
Shown source SHA256: 69dceaac752e861a29e869a905561a77730ad654a1447daf35ae69028dcf12c3
Shown target SHA256: 69dceaac752e861a29e869a905561a77730ad654a1447daf35ae69028dcf12c3

### Complete proposed decision

```json
{
  "claimId": "claim_8aaf2ab8cab3add036bfb158a244e225",
  "sourceUnitDigest": "69dceaac752e861a29e869a905561a77730ad654a1447daf35ae69028dcf12c3",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-48",
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-76 (source lines 652-674) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-48 (candidate lines 465-487). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "69dceaac752e861a29e869a905561a77730ad654a1447daf35ae69028dcf12c3",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.4 `ConfinementPlan`"
  ]
}
```

### Full source shown text

````text
```ts
interface ConfinementPlanV1 {
  contract: 'confinement-plan.v1';
  dispatchId: string;
  decision: 'execute' | 'refuse' | 'degrade';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  grants: Array<{
    resource: string;
    access: string;
    resolvedTarget: string;
  }>;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  mismatches: Array<{ code: string; detail: string }>;
}
```
````

### Full target shown text

````text
```ts
interface ConfinementPlanV1 {
  contract: 'confinement-plan.v1';
  dispatchId: string;
  decision: 'execute' | 'refuse' | 'degrade';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  grants: Array<{
    resource: string;
    access: string;
    resolvedTarget: string;
  }>;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  mismatches: Array<{ code: string; detail: string }>;
}
```
````

## claim_bb1abedd6124e01311d47db329134ed2

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-77; lines 676–679; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.4 `ConfinementPlan`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-49; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.4 `ConfinementPlan`"].
Source digest: 55919a3c62b46ee8432b975ae44c4fcd01074f7403f6e627f72500559d1a1128
Target digest: 55919a3c62b46ee8432b975ae44c4fcd01074f7403f6e627f72500559d1a1128
Shown source SHA256: 55919a3c62b46ee8432b975ae44c4fcd01074f7403f6e627f72500559d1a1128
Shown target SHA256: 55919a3c62b46ee8432b975ae44c4fcd01074f7403f6e627f72500559d1a1128

### Complete proposed decision

```json
{
  "claimId": "claim_bb1abedd6124e01311d47db329134ed2",
  "sourceUnitDigest": "55919a3c62b46ee8432b975ae44c4fcd01074f7403f6e627f72500559d1a1128",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-49",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-77 (source lines 676-679) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-49 (candidate lines 489-492). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "55919a3c62b46ee8432b975ae44c4fcd01074f7403f6e627f72500559d1a1128",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.4 `ConfinementPlan`"
  ]
}
```

### Full source shown text

```text
Plan không chứa credential value. `resolvedTarget` có thể bị redact trong event
public, nhưng run record cục bộ phải đủ thông tin để audit grant.
`grants[].resolvedTarget` là executionTarget.path của entry cùng resource trong
resources; identity/location nằm ở resources, không suy từ string path.
```

### Full target shown text

```text
Plan không chứa credential value. `resolvedTarget` có thể bị redact trong event
public, nhưng run record cục bộ phải đủ thông tin để audit grant.
`grants[].resolvedTarget` là executionTarget.path của entry cùng resource trong
resources; identity/location nằm ở resources, không suy từ string path.
```

## claim_bc98aa13763205eb00cee4cc4b098195

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-78; lines 681–686; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.4 `ConfinementPlan`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-50; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.4 `ConfinementPlan`"].
Source digest: b166dfcc0268ae16b1c802d447fae76e3fcf211d53db89d771658ac6f06fe381
Target digest: b166dfcc0268ae16b1c802d447fae76e3fcf211d53db89d771658ac6f06fe381
Shown source SHA256: b166dfcc0268ae16b1c802d447fae76e3fcf211d53db89d771658ac6f06fe381
Shown target SHA256: b166dfcc0268ae16b1c802d447fae76e3fcf211d53db89d771658ac6f06fe381

### Complete proposed decision

```json
{
  "claimId": "claim_bc98aa13763205eb00cee4cc4b098195",
  "sourceUnitDigest": "b166dfcc0268ae16b1c802d447fae76e3fcf211d53db89d771658ac6f06fe381",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-50",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-78 (source lines 681-686) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-50 (candidate lines 494-499). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "b166dfcc0268ae16b1c802d447fae76e3fcf211d53db89d771658ac6f06fe381",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.4 `ConfinementPlan`"
  ]
}
```

### Full source shown text

```text
`required` cộng bất kỳ control nào `unsatisfied|unknown` dẫn tới
`refuse`; grant optional không resolve là ngoại lệ hẹp: nó là `unverified`
nhưng không mismatch. `preferred` có thể dẫn tới `degrade`, nhưng phải có mismatch và
attestation. `coverage` phải có entry cho toàn bộ control và grant trong
`requested.policy`; thiếu entry là `unknown` và bị từ chối trong `required`.
Không có degrade âm thầm.
```

### Full target shown text

```text
`required` cộng bất kỳ control nào `unsatisfied|unknown` dẫn tới
`refuse`; grant optional không resolve là ngoại lệ hẹp: nó là `unverified`
nhưng không mismatch. `preferred` có thể dẫn tới `degrade`, nhưng phải có mismatch và
attestation. `coverage` phải có entry cho toàn bộ control và grant trong
`requested.policy`; thiếu entry là `unknown` và bị từ chối trong `required`.
Không có degrade âm thầm.
```

## claim_8c848adf5a592f82165f0d8961dcff9e

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-79; lines 688–694; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.4 `ConfinementPlan`"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-51; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.4 `ConfinementPlan`"].
Source digest: c55f6ec48cf55337094638acaca6e109f0d37c78715262afa2f18b9f24040c46
Target digest: c55f6ec48cf55337094638acaca6e109f0d37c78715262afa2f18b9f24040c46
Shown source SHA256: c55f6ec48cf55337094638acaca6e109f0d37c78715262afa2f18b9f24040c46
Shown target SHA256: c55f6ec48cf55337094638acaca6e109f0d37c78715262afa2f18b9f24040c46

### Complete proposed decision

```json
{
  "claimId": "claim_8c848adf5a592f82165f0d8961dcff9e",
  "sourceUnitDigest": "c55f6ec48cf55337094638acaca6e109f0d37c78715262afa2f18b9f24040c46",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-51",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-79 (source lines 688-694) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-51 (candidate lines 501-507). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "c55f6ec48cf55337094638acaca6e109f0d37c78715262afa2f18b9f24040c46",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.4 `ConfinementPlan`"
  ]
}
```

### Full source shown text

```text
Coverage dùng key `control:<name>` và `grant:<resource>`, mỗi resource chỉ có
một grant. Grant coverage satisfied nghĩa là quyền thực tế không vượt giới hạn,
không có nghĩa đủ quyền chạy việc. Readiness dùng key resource từ resourceNeeds:
satisfied khi nhu cầu thực thi được cấp đủ. Readiness unsatisfied/unknown luôn
refuse, kể cả preferred. Backend cấp read cho grant read-write vẫn có thể đạt
coverage, nhưng need write sẽ không đạt readiness. Grant là exception của deny;
khi trục hostRead/hostWrite là allow, grant không tạo deny ngầm trên trục đó.
```

### Full target shown text

```text
Coverage dùng key `control:<name>` và `grant:<resource>`, mỗi resource chỉ có
một grant. Grant coverage satisfied nghĩa là quyền thực tế không vượt giới hạn,
không có nghĩa đủ quyền chạy việc. Readiness dùng key resource từ resourceNeeds:
satisfied khi nhu cầu thực thi được cấp đủ. Readiness unsatisfied/unknown luôn
refuse, kể cả preferred. Backend cấp read cho grant read-write vẫn có thể đạt
coverage, nhưng need write sẽ không đạt readiness. Grant là exception của deny;
khi trục hostRead/hostWrite là allow, grant không tạo deny ngầm trên trục đó.
```

## claim_f6c28a9097619631e3c748472cb73eac

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#65-backend-port; lines 696–696; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#65-backend-port; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: bee6e6dcece03c04e46abffb9f0c09dde3b827cd7a14dd0564144a5f4f54edf0
Target digest: bee6e6dcece03c04e46abffb9f0c09dde3b827cd7a14dd0564144a5f4f54edf0
Shown source SHA256: cf3471767e6353551023ff3fca7749b9c8563856c036e53f4ba6ef7bd28f2186
Shown target SHA256: cf3471767e6353551023ff3fca7749b9c8563856c036e53f4ba6ef7bd28f2186

### Complete proposed decision

```json
{
  "claimId": "claim_f6c28a9097619631e3c748472cb73eac",
  "sourceUnitDigest": "bee6e6dcece03c04e46abffb9f0c09dde3b827cd7a14dd0564144a5f4f54edf0",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "65-backend-port",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#65-backend-port (source lines 696-696) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#65-backend-port (candidate lines 509-509). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "bee6e6dcece03c04e46abffb9f0c09dde3b827cd7a14dd0564144a5f4f54edf0",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

````text
### 6.5 Backend port

Driver chỉ assess control/grant thuộc backend; Authority điền context coverage
session/workspace và readiness chung trước compile. Thiếu entry => unknown áp
dụng sau bước hợp này, không bắt driver tự xác nhận context.

```ts
interface ResolvedBackendInstanceV1 {
  id: string;
  type: string;
  config: Readonly<Record<string, unknown>>;
}

interface BackendAssessmentV1 {
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  mismatches: Array<{ code: string; detail: string }>;
}

interface ConfinementBackendRegistryV1 {
  resolve(instanceId: string): ResolvedBackendInstanceV1 | null;
}

interface ConfinementBackendDriverV1 {
  type: string;
  version: string;
  validateConfig(config: unknown): BackendConfigValidation;
  assess(
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ): BackendAssessmentV1;
  prepare(
    plan: ConfinementPlanV1,
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ):
    Promise<PreparedConfinementV1>;
}

interface PreparedConfinementV1 {
  invocation: ConfinementRequestV1['invocation'];
  contextPatch?: Record<string, unknown>;
  claims: Record<string, CoverageStatus>;
  cleanup(): Promise<void>;
}

```

Nếu `prepare` tạo được resource rồi thất bại, driver phải throw lỗi typed có
`cleanup` handle; Authority gọi handle đó trong `finally`. Cancel, timeout,
spawn failure và process crash đều đi qua cùng đường cleanup. Mismatch phát hiện
sau spawn là `confinement-violation`/`confinement-execution-failed` và không thể
đổi thành refusal hồi tố. Authority ghi attestation `failed` cùng execution
error và cleanup result. Đây là đường xử lý khi process Authority còn sống;
Authority crash được phục hồi theo recovery profile ở §8.6.

Chỉ backend driver `type` đăng ký qua allowlist trong code. Backend instance ID
và config nằm trong machine registry, vì vậy người vận hành có thể đọc và tham
chiếu nó trực tiếp nhưng project caller không thể thay thế nội dung. Driver
schema phải từ chối key lạ. `assess` chỉ báo coverage và mismatch; Authority mới
sở hữu quyết định `execute|refuse|degrade` và compile `ConfinementPlanV1`.
`prepare` không được spawn agent. Authority so claims của kết quả prepare với
plan trước khi gọi adapter.

Mỗi dispatch dùng đúng một backend instance. Một driver có thể phối hợp nhiều
primitive nội bộ để thực hiện filesystem, home, process hoặc network control,
nhưng không phơi composition đó thành array/strategy trong executor config.
Nếu backend đã chọn không cover policy, `required` phải refuse; Authority không
tự đổi sang backend khác.

Backend driver không được branch theo `executorId`, `providerModel`, Codex,
Claude hay agent type khác. Nó chỉ nhận invocation, resolved semantic grants và
control chuẩn. Provider adapter/normalizer chịu trách nhiệm diễn tả nhu cầu đặc
thù thành binding chuẩn trước cửa, ví dụ bind resource `private-home` vào env
`CODEX_HOME`; Authority resolve resource, còn backend chỉ áp dụng binding đã
được duyệt. Nhờ vậy bỏ provider recipe mà không giấu recipe thành `if` trong
driver.
````

### Full target shown text

````text
### 6.5 Backend port

Driver chỉ assess control/grant thuộc backend; Authority điền context coverage
session/workspace và readiness chung trước compile. Thiếu entry => unknown áp
dụng sau bước hợp này, không bắt driver tự xác nhận context.

```ts
interface ResolvedBackendInstanceV1 {
  id: string;
  type: string;
  config: Readonly<Record<string, unknown>>;
}

interface BackendAssessmentV1 {
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  mismatches: Array<{ code: string; detail: string }>;
}

interface ConfinementBackendRegistryV1 {
  resolve(instanceId: string): ResolvedBackendInstanceV1 | null;
}

interface ConfinementBackendDriverV1 {
  type: string;
  version: string;
  validateConfig(config: unknown): BackendConfigValidation;
  assess(
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ): BackendAssessmentV1;
  prepare(
    plan: ConfinementPlanV1,
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ):
    Promise<PreparedConfinementV1>;
}

interface PreparedConfinementV1 {
  invocation: ConfinementRequestV1['invocation'];
  contextPatch?: Record<string, unknown>;
  claims: Record<string, CoverageStatus>;
  cleanup(): Promise<void>;
}

```

Nếu `prepare` tạo được resource rồi thất bại, driver phải throw lỗi typed có
`cleanup` handle; Authority gọi handle đó trong `finally`. Cancel, timeout,
spawn failure và process crash đều đi qua cùng đường cleanup. Mismatch phát hiện
sau spawn là `confinement-violation`/`confinement-execution-failed` và không thể
đổi thành refusal hồi tố. Authority ghi attestation `failed` cùng execution
error và cleanup result. Đây là đường xử lý khi process Authority còn sống;
Authority crash được phục hồi theo recovery profile ở §8.6.

Chỉ backend driver `type` đăng ký qua allowlist trong code. Backend instance ID
và config nằm trong machine registry, vì vậy người vận hành có thể đọc và tham
chiếu nó trực tiếp nhưng project caller không thể thay thế nội dung. Driver
schema phải từ chối key lạ. `assess` chỉ báo coverage và mismatch; Authority mới
sở hữu quyết định `execute|refuse|degrade` và compile `ConfinementPlanV1`.
`prepare` không được spawn agent. Authority so claims của kết quả prepare với
plan trước khi gọi adapter.

Mỗi dispatch dùng đúng một backend instance. Một driver có thể phối hợp nhiều
primitive nội bộ để thực hiện filesystem, home, process hoặc network control,
nhưng không phơi composition đó thành array/strategy trong executor config.
Nếu backend đã chọn không cover policy, `required` phải refuse; Authority không
tự đổi sang backend khác.

Backend driver không được branch theo `executorId`, `providerModel`, Codex,
Claude hay agent type khác. Nó chỉ nhận invocation, resolved semantic grants và
control chuẩn. Provider adapter/normalizer chịu trách nhiệm diễn tả nhu cầu đặc
thù thành binding chuẩn trước cửa, ví dụ bind resource `private-home` vào env
`CODEX_HOME`; Authority resolve resource, còn backend chỉ áp dụng binding đã
được duyệt. Nhờ vậy bỏ provider recipe mà không giấu recipe thành `if` trong
driver.
````

## claim_14051869225dc8365787e98bc34a696f

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-80; lines 698–700; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.5 Backend port"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-52; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.5 Backend port"].
Source digest: 7718d52080bcbfd8bb8f3fa0973b4049dd6b2a03ea35c45f7074b8b6367792c5
Target digest: 7718d52080bcbfd8bb8f3fa0973b4049dd6b2a03ea35c45f7074b8b6367792c5
Shown source SHA256: 7718d52080bcbfd8bb8f3fa0973b4049dd6b2a03ea35c45f7074b8b6367792c5
Shown target SHA256: 7718d52080bcbfd8bb8f3fa0973b4049dd6b2a03ea35c45f7074b8b6367792c5

### Complete proposed decision

```json
{
  "claimId": "claim_14051869225dc8365787e98bc34a696f",
  "sourceUnitDigest": "7718d52080bcbfd8bb8f3fa0973b4049dd6b2a03ea35c45f7074b8b6367792c5",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-52",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-80 (source lines 698-700) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-52 (candidate lines 511-513). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7718d52080bcbfd8bb8f3fa0973b4049dd6b2a03ea35c45f7074b8b6367792c5",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.5 Backend port"
  ]
}
```

### Full source shown text

```text
Driver chỉ assess control/grant thuộc backend; Authority điền context coverage
session/workspace và readiness chung trước compile. Thiếu entry => unknown áp
dụng sau bước hợp này, không bắt driver tự xác nhận context.
```

### Full target shown text

```text
Driver chỉ assess control/grant thuộc backend; Authority điền context coverage
session/workspace và readiness chung trước compile. Thiếu entry => unknown áp
dụng sau bước hợp này, không bắt driver tự xác nhận context.
```

## claim_23f24412e9b7d9cd5e0d20ad7061b716

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-81; lines 702–743; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.5 Backend port"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-53; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.5 Backend port"].
Source digest: e81a571e9b40f865f5f99d9059280046325b34ab251552aab97756381f5df132
Target digest: e81a571e9b40f865f5f99d9059280046325b34ab251552aab97756381f5df132
Shown source SHA256: e81a571e9b40f865f5f99d9059280046325b34ab251552aab97756381f5df132
Shown target SHA256: e81a571e9b40f865f5f99d9059280046325b34ab251552aab97756381f5df132

### Complete proposed decision

```json
{
  "claimId": "claim_23f24412e9b7d9cd5e0d20ad7061b716",
  "sourceUnitDigest": "e81a571e9b40f865f5f99d9059280046325b34ab251552aab97756381f5df132",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-53",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-81 (source lines 702-743) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-53 (candidate lines 515-556). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "e81a571e9b40f865f5f99d9059280046325b34ab251552aab97756381f5df132",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.5 Backend port"
  ]
}
```

### Full source shown text

````text
```ts
interface ResolvedBackendInstanceV1 {
  id: string;
  type: string;
  config: Readonly<Record<string, unknown>>;
}

interface BackendAssessmentV1 {
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  mismatches: Array<{ code: string; detail: string }>;
}

interface ConfinementBackendRegistryV1 {
  resolve(instanceId: string): ResolvedBackendInstanceV1 | null;
}

interface ConfinementBackendDriverV1 {
  type: string;
  version: string;
  validateConfig(config: unknown): BackendConfigValidation;
  assess(
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ): BackendAssessmentV1;
  prepare(
    plan: ConfinementPlanV1,
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ):
    Promise<PreparedConfinementV1>;
}

interface PreparedConfinementV1 {
  invocation: ConfinementRequestV1['invocation'];
  contextPatch?: Record<string, unknown>;
  claims: Record<string, CoverageStatus>;
  cleanup(): Promise<void>;
}

```
````

### Full target shown text

````text
```ts
interface ResolvedBackendInstanceV1 {
  id: string;
  type: string;
  config: Readonly<Record<string, unknown>>;
}

interface BackendAssessmentV1 {
  coverage: Record<string, CoverageStatus>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  mismatches: Array<{ code: string; detail: string }>;
}

interface ConfinementBackendRegistryV1 {
  resolve(instanceId: string): ResolvedBackendInstanceV1 | null;
}

interface ConfinementBackendDriverV1 {
  type: string;
  version: string;
  validateConfig(config: unknown): BackendConfigValidation;
  assess(
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ): BackendAssessmentV1;
  prepare(
    plan: ConfinementPlanV1,
    request: ConfinementRequestV1,
    backend: ResolvedBackendInstanceV1,
  ):
    Promise<PreparedConfinementV1>;
}

interface PreparedConfinementV1 {
  invocation: ConfinementRequestV1['invocation'];
  contextPatch?: Record<string, unknown>;
  claims: Record<string, CoverageStatus>;
  cleanup(): Promise<void>;
}

```
````

## claim_6cb105f8711384b40dda46a177f3232b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-82; lines 745–751; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.5 Backend port"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-54; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.5 Backend port"].
Source digest: 046c553717b3b1b9f594a9befbd04ef2b033b5a4d266293ac583a2e2ff9d9140
Target digest: 046c553717b3b1b9f594a9befbd04ef2b033b5a4d266293ac583a2e2ff9d9140
Shown source SHA256: 046c553717b3b1b9f594a9befbd04ef2b033b5a4d266293ac583a2e2ff9d9140
Shown target SHA256: 046c553717b3b1b9f594a9befbd04ef2b033b5a4d266293ac583a2e2ff9d9140

### Complete proposed decision

```json
{
  "claimId": "claim_6cb105f8711384b40dda46a177f3232b",
  "sourceUnitDigest": "046c553717b3b1b9f594a9befbd04ef2b033b5a4d266293ac583a2e2ff9d9140",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-54",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-82 (source lines 745-751) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-54 (candidate lines 558-564). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "046c553717b3b1b9f594a9befbd04ef2b033b5a4d266293ac583a2e2ff9d9140",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.5 Backend port"
  ]
}
```

### Full source shown text

```text
Nếu `prepare` tạo được resource rồi thất bại, driver phải throw lỗi typed có
`cleanup` handle; Authority gọi handle đó trong `finally`. Cancel, timeout,
spawn failure và process crash đều đi qua cùng đường cleanup. Mismatch phát hiện
sau spawn là `confinement-violation`/`confinement-execution-failed` và không thể
đổi thành refusal hồi tố. Authority ghi attestation `failed` cùng execution
error và cleanup result. Đây là đường xử lý khi process Authority còn sống;
Authority crash được phục hồi theo recovery profile ở §8.6.
```

### Full target shown text

```text
Nếu `prepare` tạo được resource rồi thất bại, driver phải throw lỗi typed có
`cleanup` handle; Authority gọi handle đó trong `finally`. Cancel, timeout,
spawn failure và process crash đều đi qua cùng đường cleanup. Mismatch phát hiện
sau spawn là `confinement-violation`/`confinement-execution-failed` và không thể
đổi thành refusal hồi tố. Authority ghi attestation `failed` cùng execution
error và cleanup result. Đây là đường xử lý khi process Authority còn sống;
Authority crash được phục hồi theo recovery profile ở §8.6.
```

## claim_81ce7171216b0ab5c9fc1550cefc6517

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-83; lines 753–759; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.5 Backend port"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-55; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.5 Backend port"].
Source digest: 7fe89045e3c2deaea6858de1a820ee4aa20aa4316e55cc36627a10e507f0d105
Target digest: 7fe89045e3c2deaea6858de1a820ee4aa20aa4316e55cc36627a10e507f0d105
Shown source SHA256: 7fe89045e3c2deaea6858de1a820ee4aa20aa4316e55cc36627a10e507f0d105
Shown target SHA256: 7fe89045e3c2deaea6858de1a820ee4aa20aa4316e55cc36627a10e507f0d105

### Complete proposed decision

```json
{
  "claimId": "claim_81ce7171216b0ab5c9fc1550cefc6517",
  "sourceUnitDigest": "7fe89045e3c2deaea6858de1a820ee4aa20aa4316e55cc36627a10e507f0d105",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-55",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-83 (source lines 753-759) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-55 (candidate lines 566-572). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7fe89045e3c2deaea6858de1a820ee4aa20aa4316e55cc36627a10e507f0d105",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.5 Backend port"
  ]
}
```

### Full source shown text

```text
Chỉ backend driver `type` đăng ký qua allowlist trong code. Backend instance ID
và config nằm trong machine registry, vì vậy người vận hành có thể đọc và tham
chiếu nó trực tiếp nhưng project caller không thể thay thế nội dung. Driver
schema phải từ chối key lạ. `assess` chỉ báo coverage và mismatch; Authority mới
sở hữu quyết định `execute|refuse|degrade` và compile `ConfinementPlanV1`.
`prepare` không được spawn agent. Authority so claims của kết quả prepare với
plan trước khi gọi adapter.
```

### Full target shown text

```text
Chỉ backend driver `type` đăng ký qua allowlist trong code. Backend instance ID
và config nằm trong machine registry, vì vậy người vận hành có thể đọc và tham
chiếu nó trực tiếp nhưng project caller không thể thay thế nội dung. Driver
schema phải từ chối key lạ. `assess` chỉ báo coverage và mismatch; Authority mới
sở hữu quyết định `execute|refuse|degrade` và compile `ConfinementPlanV1`.
`prepare` không được spawn agent. Authority so claims của kết quả prepare với
plan trước khi gọi adapter.
```

## claim_7097b62d1adb6bbc723f2ba0b17dada2

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-84; lines 761–765; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.5 Backend port"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-56; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.5 Backend port"].
Source digest: 4b4b9501f14522ae5b83efb77c99bcf71e3005b6ae4e013aa1d4eb7509d21cd8
Target digest: 4b4b9501f14522ae5b83efb77c99bcf71e3005b6ae4e013aa1d4eb7509d21cd8
Shown source SHA256: 4b4b9501f14522ae5b83efb77c99bcf71e3005b6ae4e013aa1d4eb7509d21cd8
Shown target SHA256: 4b4b9501f14522ae5b83efb77c99bcf71e3005b6ae4e013aa1d4eb7509d21cd8

### Complete proposed decision

```json
{
  "claimId": "claim_7097b62d1adb6bbc723f2ba0b17dada2",
  "sourceUnitDigest": "4b4b9501f14522ae5b83efb77c99bcf71e3005b6ae4e013aa1d4eb7509d21cd8",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-56",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-84 (source lines 761-765) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-56 (candidate lines 574-578). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "4b4b9501f14522ae5b83efb77c99bcf71e3005b6ae4e013aa1d4eb7509d21cd8",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.5 Backend port"
  ]
}
```

### Full source shown text

```text
Mỗi dispatch dùng đúng một backend instance. Một driver có thể phối hợp nhiều
primitive nội bộ để thực hiện filesystem, home, process hoặc network control,
nhưng không phơi composition đó thành array/strategy trong executor config.
Nếu backend đã chọn không cover policy, `required` phải refuse; Authority không
tự đổi sang backend khác.
```

### Full target shown text

```text
Mỗi dispatch dùng đúng một backend instance. Một driver có thể phối hợp nhiều
primitive nội bộ để thực hiện filesystem, home, process hoặc network control,
nhưng không phơi composition đó thành array/strategy trong executor config.
Nếu backend đã chọn không cover policy, `required` phải refuse; Authority không
tự đổi sang backend khác.
```

## claim_6785a5f3a9f65744e05e4aaa247dd527

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#unheaded-block-85; lines 767–773; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts","6.5 Backend port"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-57; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts","6.5 Backend port"].
Source digest: 7be3dcdd50f649f43befc5139eb6e222ff0fdd387e804b29e5b572b28a9a25f8
Target digest: 7be3dcdd50f649f43befc5139eb6e222ff0fdd387e804b29e5b572b28a9a25f8
Shown source SHA256: 7be3dcdd50f649f43befc5139eb6e222ff0fdd387e804b29e5b572b28a9a25f8
Shown target SHA256: 7be3dcdd50f649f43befc5139eb6e222ff0fdd387e804b29e5b572b28a9a25f8

### Complete proposed decision

```json
{
  "claimId": "claim_6785a5f3a9f65744e05e4aaa247dd527",
  "sourceUnitDigest": "7be3dcdd50f649f43befc5139eb6e222ff0fdd387e804b29e5b572b28a9a25f8",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "unheaded-block-57",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. The whole unheaded-block unit docs/specs/confinement-authority.md#unheaded-block-85 (source lines 767-773) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#unheaded-block-57 (candidate lines 580-586). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7be3dcdd50f649f43befc5139eb6e222ff0fdd387e804b29e5b572b28a9a25f8",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts",
    "6.5 Backend port"
  ]
}
```

### Full source shown text

```text
Backend driver không được branch theo `executorId`, `providerModel`, Codex,
Claude hay agent type khác. Nó chỉ nhận invocation, resolved semantic grants và
control chuẩn. Provider adapter/normalizer chịu trách nhiệm diễn tả nhu cầu đặc
thù thành binding chuẩn trước cửa, ví dụ bind resource `private-home` vào env
`CODEX_HOME`; Authority resolve resource, còn backend chỉ áp dụng binding đã
được duyệt. Nhờ vậy bỏ provider recipe mà không giấu recipe thành `if` trong
driver.
```

### Full target shown text

```text
Backend driver không được branch theo `executorId`, `providerModel`, Codex,
Claude hay agent type khác. Nó chỉ nhận invocation, resolved semantic grants và
control chuẩn. Provider adapter/normalizer chịu trách nhiệm diễn tả nhu cầu đặc
thù thành binding chuẩn trước cửa, ví dụ bind resource `private-home` vào env
`CODEX_HOME`; Authority resolve resource, còn backend chỉ áp dụng binding đã
được duyệt. Nhờ vậy bỏ provider recipe mà không giấu recipe thành `if` trong
driver.
```

## claim_82aa2b5b7c4edb52f6c3419234feff1b

Class: Weak-exact; mandatory deep: false.
Source: docs/specs/confinement-authority.md#66-confinementattestation; lines 775–775; ancestry ["Spec: Agent Confinement Authority","6. Canonical contracts"].
Target: docs/platform/agent-confinement/contracts/confinement-authority-v1.md#66-confinementattestation; ancestry ["Added in candidate: confinement authority v1","6. Canonical contracts"].
Source digest: 7910ea66141ac4cdc5435190e31331647fc75ef345b90de879cfe319daa295fc
Target digest: 7910ea66141ac4cdc5435190e31331647fc75ef345b90de879cfe319daa295fc
Shown source SHA256: d392ac93eae681bdb33c98370c05bc443524541c008d78d8390c94a3ea168fc6
Shown target SHA256: d392ac93eae681bdb33c98370c05bc443524541c008d78d8390c94a3ea168fc6

### Complete proposed decision

```json
{
  "claimId": "claim_82aa2b5b7c4edb52f6c3419234feff1b",
  "sourceUnitDigest": "7910ea66141ac4cdc5435190e31331647fc75ef345b90de879cfe319daa295fc",
  "targetOwner": "docs/platform/agent-confinement/contracts/confinement-authority-v1.md",
  "targetAnchor": "66-confinementattestation",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. The whole heading unit docs/specs/confinement-authority.md#66-confinementattestation (source lines 775-775) is carried at docs/platform/agent-confinement/contracts/confinement-authority-v1.md#66-confinementattestation (candidate lines 588-588). The full native unit digest is equal. Frozen specs-ui map and Step 8: preserve docs/specs/confinement-authority.md verbatim in docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/confinement-authority-v1.md, docs/platform/agent-confinement/history/rollout-and-settled-facts.md, docs/platform/agent-confinement/decisions/confinement-authority-decisions.md. Constitution kinds determine the labelled subdivisions. Original numbered headings are preserved. The legacy source remains untouched; candidate carriage authorizes neither promotion nor source retirement. Known stale source sentences and links are intentionally carried under A19/A28, not certified true. Row-specific source and target binding remain pending independent review.",
  "targetUnitDigest": "7910ea66141ac4cdc5435190e31331647fc75ef345b90de879cfe319daa295fc",
  "targetAncestry": [
    "Added in candidate: confinement authority v1",
    "6. Canonical contracts"
  ]
}
```

### Full source shown text

````text
### 6.6 `ConfinementAttestation`

```ts
interface ProbeFingerprintV1 {
  policyDigest: string;
  driverVersion: string;
  backendConfigDigest: string;
  platformDigest: string;
  providerCliDigest?: string;
  credentialLoadingDigest?: string;
  invocationTemplateDigest?: string;
  proofProfile: string;
}

interface AdapterReceiptV1 {
  contract: 'confinement-adapter-receipt.v1';
  dispatchId: string;
  preparedInvocationDigest: string;
  executionId: string;
  state: 'started' | 'stopped' | 'unknown';
}

interface ConfinementAttestationV1 {
  contract: 'confinement-attestation.v1';
  dispatchId: string;
  phase: 'prepared' | 'completed' | 'failed' | 'refused';
  outcome: 'enforced' | 'unconfined' | 'degraded' | 'refused' | 'unknown';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  effectiveControls: Partial<ConfinementPolicyV1['controls']>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  channels: Array<{
    name: 'filesystem' | 'inherited-fd' | 'stdio' | 'host-ipc' | 'network';
    coverage: 'covered' | 'out-of-scope' | 'unknown';
    detail: string;
  }>;
  receipt: AdapterReceiptV1 | null;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  grants: Array<{ resource: string; access: string; target: string }>;
  mismatches: Array<{ code: string; detail: string }>;
  evidence: Array<{
    kind: 'falsification-probe' | 'structural-observation' | 'post-check';
    ref: string;
    freshness: 'current' | 'stale' | 'not-run';
    fingerprint?: ProbeFingerprintV1;
  }>;
  cleanup: { status: 'not-needed' | 'pending' | 'completed' | 'failed'; error?: string };
}
```

`prepared` chỉ nói invocation đã được Authority dựng; không được đổi tên thành
`verified`. `completed` ghi execution outcome và post-check nếu có. `failed`
ghi execution hoặc cleanup failure sau khi đã prepare; `refused` ghi quyết định
không spawn. `enforced` chỉ hợp lệ khi mọi control/grant yêu cầu có coverage
`satisfied`, claims khớp plan, adapter đã chạy invocation đã prepare, và evidence
cần thiết là `current`. Nếu một phần không thể xác định thì outcome là
`unknown`; `required` trong trạng thái đó phải refuse nếu trạng thái được biết
trước spawn. Nếu unknown chỉ xuất hiện sau spawn, đó là execution failure và
không thể đổi thành refusal hồi tố. Chỉ probe độc lập mới
được ghi evidence `falsification-probe`; đọc lại argv chỉ là
`structural-observation` và không thể một mình nâng outcome lên `enforced`.

Trước spawn, `required` cần assessment đủ coverage, prepare claims khớp plan
và chứng nhận probe độc lập còn hiệu lực; chưa cần bằng chứng agent đã chạy.
Sau spawn, adapter receipt gắn dispatch id và digest prepared invocation là
structural evidence bổ sung để kết luận `enforced`, không thay thế probe.
`prepared` với mode required ghi outcome `unknown` vì execution chưa xảy ra;
điều này không đồng nghĩa assessment coverage là unknown.

Proof profile đăng ký trong code quyết định fingerprint component bắt buộc.
`local-bwrap-v1` yêu cầu policy, driver version, backend config, platform digest
(kernel/bwrap); readiness recipe dùng provider CLI/credential-loading/invocation
digest khi kết quả phụ thuộc chúng. Không được bỏ dependency thực sự để tránh
stale. Path runtime chuẩn hóa theo resource identity. Component bắt buộc đổi
thì proof tương ứng stale; component không áp dụng không cần giá trị giả.
Authority tự chạy lại probe đã đăng ký khi stale trước required spawn, dùng
single-flight/cache theo fingerprint, timeout hữu hạn, và ghi evidence mới.
Probe fail/timeout thì refuse có lý do; không cần người chạy doctor để đi tiếp
khi probe có thể tự thành công. Doctor dùng cùng harness và giải thích lỗi.
Tính độc lập là test input/assertion không lấy kết quả mong đợi từ claims của
driver; không phụ thuộc ai khởi chạy probe. Backend không tự chứng nhận mình.

Falsification-probe evidence bắt buộc có fingerprint; receipt do trusted adapter
phát, không lấy từ stdout của agent. Platform digest gồm kernel/runtime và
sandbox binary/image theo proofProfile. Evidence ref trỏ tới record versioned
do Authority kiểm tra; thiếu component bắt buộc theo proofProfile không được current.
Channels luôn có đủ năm entry trên; out-of-scope không được dùng để miễn
filesystem hay inherited-fd khi hostWrite deny. Violation đã xác nhận ghi
phase failed, outcome degraded và mismatch; unknown dành cho thiếu bằng chứng.

Authority lưu plan, prepared record và terminal attestation vào machine state
store do host quản lý, mặc định ngoài project `.fgos/` và ngoài mọi write grant
của agent. Trước mỗi persist Authority kiểm tra containment hai chiều giữa store
và mọi resolved writable resource; bất kỳ overlap nào phải refuse, không được
ghi record vào vùng grant. Run-output chỉ chứa artifact của agent
và có thể chứa bản sao attestation, không phải durable truth. Event committed
chỉ chứa dispatch id, outcome, mismatch code và reference/digest tới record đã
redact; không chứa credential, raw env hay absolute sensitive path. Recovery
giữ record prepared chưa có terminal ở trạng thái unknown, không suy thành công.
````

### Full target shown text

````text
### 6.6 `ConfinementAttestation`

```ts
interface ProbeFingerprintV1 {
  policyDigest: string;
  driverVersion: string;
  backendConfigDigest: string;
  platformDigest: string;
  providerCliDigest?: string;
  credentialLoadingDigest?: string;
  invocationTemplateDigest?: string;
  proofProfile: string;
}

interface AdapterReceiptV1 {
  contract: 'confinement-adapter-receipt.v1';
  dispatchId: string;
  preparedInvocationDigest: string;
  executionId: string;
  state: 'started' | 'stopped' | 'unknown';
}

interface ConfinementAttestationV1 {
  contract: 'confinement-attestation.v1';
  dispatchId: string;
  phase: 'prepared' | 'completed' | 'failed' | 'refused';
  outcome: 'enforced' | 'unconfined' | 'degraded' | 'refused' | 'unknown';
  requested: ResolvedConfinementRequirementV1;
  coverage: Record<string, CoverageStatus>;
  effectiveControls: Partial<ConfinementPolicyV1['controls']>;
  resources: ResolvedResourceV1[];
  readiness: Record<string, CoverageStatus>;
  channels: Array<{
    name: 'filesystem' | 'inherited-fd' | 'stdio' | 'host-ipc' | 'network';
    coverage: 'covered' | 'out-of-scope' | 'unknown';
    detail: string;
  }>;
  receipt: AdapterReceiptV1 | null;
  backend: {
    id: string;
    type: string;
    version: string;
    configDigest: string;
  } | null;
  grants: Array<{ resource: string; access: string; target: string }>;
  mismatches: Array<{ code: string; detail: string }>;
  evidence: Array<{
    kind: 'falsification-probe' | 'structural-observation' | 'post-check';
    ref: string;
    freshness: 'current' | 'stale' | 'not-run';
    fingerprint?: ProbeFingerprintV1;
  }>;
  cleanup: { status: 'not-needed' | 'pending' | 'completed' | 'failed'; error?: string };
}
```

`prepared` chỉ nói invocation đã được Authority dựng; không được đổi tên thành
`verified`. `completed` ghi execution outcome và post-check nếu có. `failed`
ghi execution hoặc cleanup failure sau khi đã prepare; `refused` ghi quyết định
không spawn. `enforced` chỉ hợp lệ khi mọi control/grant yêu cầu có coverage
`satisfied`, claims khớp plan, adapter đã chạy invocation đã prepare, và evidence
cần thiết là `current`. Nếu một phần không thể xác định thì outcome là
`unknown`; `required` trong trạng thái đó phải refuse nếu trạng thái được biết
trước spawn. Nếu unknown chỉ xuất hiện sau spawn, đó là execution failure và
không thể đổi thành refusal hồi tố. Chỉ probe độc lập mới
được ghi evidence `falsification-probe`; đọc lại argv chỉ là
`structural-observation` và không thể một mình nâng outcome lên `enforced`.

Trước spawn, `required` cần assessment đủ coverage, prepare claims khớp plan
và chứng nhận probe độc lập còn hiệu lực; chưa cần bằng chứng agent đã chạy.
Sau spawn, adapter receipt gắn dispatch id và digest prepared invocation là
structural evidence bổ sung để kết luận `enforced`, không thay thế probe.
`prepared` với mode required ghi outcome `unknown` vì execution chưa xảy ra;
điều này không đồng nghĩa assessment coverage là unknown.

Proof profile đăng ký trong code quyết định fingerprint component bắt buộc.
`local-bwrap-v1` yêu cầu policy, driver version, backend config, platform digest
(kernel/bwrap); readiness recipe dùng provider CLI/credential-loading/invocation
digest khi kết quả phụ thuộc chúng. Không được bỏ dependency thực sự để tránh
stale. Path runtime chuẩn hóa theo resource identity. Component bắt buộc đổi
thì proof tương ứng stale; component không áp dụng không cần giá trị giả.
Authority tự chạy lại probe đã đăng ký khi stale trước required spawn, dùng
single-flight/cache theo fingerprint, timeout hữu hạn, và ghi evidence mới.
Probe fail/timeout thì refuse có lý do; không cần người chạy doctor để đi tiếp
khi probe có thể tự thành công. Doctor dùng cùng harness và giải thích lỗi.
Tính độc lập là test input/assertion không lấy kết quả mong đợi từ claims của
driver; không phụ thuộc ai khởi chạy probe. Backend không tự chứng nhận mình.

Falsification-probe evidence bắt buộc có fingerprint; receipt do trusted adapter
phát, không lấy từ stdout của agent. Platform digest gồm kernel/runtime và
sandbox binary/image theo proofProfile. Evidence ref trỏ tới record versioned
do Authority kiểm tra; thiếu component bắt buộc theo proofProfile không được current.
Channels luôn có đủ năm entry trên; out-of-scope không được dùng để miễn
filesystem hay inherited-fd khi hostWrite deny. Violation đã xác nhận ghi
phase failed, outcome degraded và mismatch; unknown dành cho thiếu bằng chứng.

Authority lưu plan, prepared record và terminal attestation vào machine state
store do host quản lý, mặc định ngoài project `.fgos/` và ngoài mọi write grant
của agent. Trước mỗi persist Authority kiểm tra containment hai chiều giữa store
và mọi resolved writable resource; bất kỳ overlap nào phải refuse, không được
ghi record vào vùng grant. Run-output chỉ chứa artifact của agent
và có thể chứa bản sao attestation, không phải durable truth. Event committed
chỉ chứa dispatch id, outcome, mismatch code và reference/digest tới record đã
redact; không chứa credential, raw env hay absolute sensitive path. Recovery
giữ record prepared chưa có terminal ở trạng thái unknown, không suy thành công.
````
