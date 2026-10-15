# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **34**. Target: `docs/platform/runner/decisions/h-36d872fbb0e5.md`; part 5/5. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `d442f8d2ecd1660e95a12269d0041b64d59a3ad541113ddc1bac8854f76fb68e`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **10/34** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_b2d081ec1426e138bd79fc0703ba645a",
      "claim_c7fbd134619006f07ca2281f69601c5d",
      "claim_de96b9e2eda969f6cf15d3c98779e1ee",
      "claim_65ec90fc672e6d1a8dff764c3e3dd516",
      "claim_8f31a4f2f6b6f91fcbf89cace7be6bff",
      "claim_6f695d26a139ec834153e132e8024107",
      "claim_5f10674a9a170a84bfd02d6b1462ea18",
      "claim_5348a42561949a4c0042f0196fe52f56",
      "claim_65304cc9e0b7cd5027ee9a2589b612c8",
      "claim_dc4ce18e6e9fb14f1c49564fb00173ba",
      "claim_c7b6b863e630f2b685c29f09b5db02c4",
      "claim_0ff1945d9de2483e7c615450e71b8bcf",
      "claim_a3e251ef31f006e7fd01ebc9640b94ca",
      "claim_46e3a4ecadf497d511207c7a4e5c87a8",
      "claim_f9fd15e1ac6018eabd8bcfc94a50e77d",
      "claim_9152712f05f3390687f5b4d9ef102e75",
      "claim_f58bf45ca4affd0474b1e864c26c6e62",
      "claim_a2f67de75a538ea78e1bb035e6d1c0a9",
      "claim_5e6715ecc0c3c71e135748edf54d4271",
      "claim_9a5a4c7c4939080ea71ffaf460d87e7a",
      "claim_17061fbe7eb887241536b870f6d10a12",
      "claim_89cb129252c64e683e06902d3a1e2516",
      "claim_fd4f7bc3b9f656db315c5f1320b8dab4",
      "claim_2cc4d2b5012fb6dd687f1c357d95a466",
      "claim_5279f84afaf9f09dd512101da18905c5",
      "claim_ab04d755d36af00cb6ce157d829c8181",
      "claim_a28c06e333e3d09c3801e2b56ebd04a1",
      "claim_b31ad90d68cd5644cca87a4c3f74a438",
      "claim_ad2cb8f645df6b08658a2b32ae2a8dcb",
      "claim_e1abc43e9b408449d93b9fa00a00dd68",
      "claim_f679b132df0a3819847b51552ab3a9b6",
      "claim_77e723624e1ae0a9c2e5e7e043fca4be",
      "claim_5788dd19c4378fbb442c6a455f0e7857",
      "claim_6eb47bc2e3c271b4af46b09fc2c4e90c"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [
    "claim_de96b9e2eda969f6cf15d3c98779e1ee",
    "claim_65ec90fc672e6d1a8dff764c3e3dd516",
    "claim_a3e251ef31f006e7fd01ebc9640b94ca",
    "claim_46e3a4ecadf497d511207c7a4e5c87a8",
    "claim_f58bf45ca4affd0474b1e864c26c6e62",
    "claim_a2f67de75a538ea78e1bb035e6d1c0a9",
    "claim_5e6715ecc0c3c71e135748edf54d4271",
    "claim_9a5a4c7c4939080ea71ffaf460d87e7a",
    "claim_17061fbe7eb887241536b870f6d10a12",
    "claim_89cb129252c64e683e06902d3a1e2516",
    "claim_fd4f7bc3b9f656db315c5f1320b8dab4",
    "claim_2cc4d2b5012fb6dd687f1c357d95a466",
    "claim_5279f84afaf9f09dd512101da18905c5",
    "claim_ab04d755d36af00cb6ce157d829c8181",
    "claim_a28c06e333e3d09c3801e2b56ebd04a1",
    "claim_b31ad90d68cd5644cca87a4c3f74a438",
    "claim_ad2cb8f645df6b08658a2b32ae2a8dcb",
    "claim_e1abc43e9b408449d93b9fa00a00dd68",
    "claim_f679b132df0a3819847b51552ab3a9b6",
    "claim_77e723624e1ae0a9c2e5e7e043fca4be",
    "claim_5788dd19c4378fbb442c6a455f0e7857",
    "claim_6eb47bc2e3c271b4af46b09fc2c4e90c"
  ],
  "reboundAnchorIDs": [
    "claim_de96b9e2eda969f6cf15d3c98779e1ee",
    "claim_65ec90fc672e6d1a8dff764c3e3dd516",
    "claim_a3e251ef31f006e7fd01ebc9640b94ca",
    "claim_46e3a4ecadf497d511207c7a4e5c87a8"
  ]
}
```

## claim_b2d081ec1426e138bd79fc0703ba645a

Source digest: 3e06e42c903776657538aeb0c3293d568aeaaed3c5ee38896d893cccd4c15e09

Target digest: 3e06e42c903776657538aeb0c3293d568aeaaed3c5ee38896d893cccd4c15e09

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng",
  "sourceLines": [
    3088,
    3088
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_dd6576a857f0f3b9394180103a0271a8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b2d081ec1426e138bd79fc0703ba645a",
    "sourceUnitDigest": "3e06e42c903776657538aeb0c3293d568aeaaed3c5ee38896d893cccd4c15e09",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng (lines 3088–3088) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3e06e42c903776657538aeb0c3293d568aeaaed3c5ee38896d893cccd4c15e09",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0046 — Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng

- **Trạng thái:** Settled (Phase 1–4 hoàn tất, 2026-10-01)
- **Bối cảnh:** Câu hỏi "bước này dùng model mạnh tới đâu" từng bị chồng chéo bởi 10 khái niệm (`size`/work tier, `runner.models`, `tier`/`minTier`, `modelPolicies`, `rigor`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, PlacementPolicy shadow). Ba track trước làm theo kiểu additive + shadow, không xoá, dẫn đến tích tụ lớp chồng.
- **Quyết định:**
  1. Bên cầu chỉ dùng `rigor` (`low|standard|high|critical`); bên cung chỉ dùng `tier` (`nano|mini|standard|advanced|flagship|frontier`) qua `rigorToTier`.
  2. Một resolver duy nhất: `resolveTierModel(cfg, tier, provider)`.
  3. Xoá vĩnh viễn: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `runner.models`, `capabilities.*.overrides`.
  4. Sàn theo loại việc `capabilities.<cap>.rigor`, merge chỉ-nâng với provenance `rigorSource: capability`.
  5. Tách `work.tier` thành `work.size` (độ lớn, không tới model) và `work.rigor` (tuỳ chọn, discovery phán); đường đọc duy nhất map event cũ `tier → size` và `risk: heavy` → `rigor: high`. Snapshot `state.json` mang `viewSchemaVersion: 2`.
  6. Doctor checks (`tier-vocabulary-dead-keys`, `model-policy-tier-coverage`, `coordination-protocol-dead-vocabulary`) và dead vocabulary guard bảo vệ cấu trúc.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0046 — Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng

- **Trạng thái:** Settled (Phase 1–4 hoàn tất, 2026-10-01)
- **Bối cảnh:** Câu hỏi "bước này dùng model mạnh tới đâu" từng bị chồng chéo bởi 10 khái niệm (`size`/work tier, `runner.models`, `tier`/`minTier`, `modelPolicies`, `rigor`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, PlacementPolicy shadow). Ba track trước làm theo kiểu additive + shadow, không xoá, dẫn đến tích tụ lớp chồng.
- **Quyết định:**
  1. Bên cầu chỉ dùng `rigor` (`low|standard|high|critical`); bên cung chỉ dùng `tier` (`nano|mini|standard|advanced|flagship|frontier`) qua `rigorToTier`.
  2. Một resolver duy nhất: `resolveTierModel(cfg, tier, provider)`.
  3. Xoá vĩnh viễn: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `runner.models`, `capabilities.*.overrides`.
  4. Sàn theo loại việc `capabilities.<cap>.rigor`, merge chỉ-nâng với provenance `rigorSource: capability`.
  5. Tách `work.tier` thành `work.size` (độ lớn, không tới model) và `work.rigor` (tuỳ chọn, discovery phán); đường đọc duy nhất map event cũ `tier → size` và `risk: heavy` → `rigor: high`. Snapshot `state.json` mang `viewSchemaVersion: 2`.
  6. Doctor checks (`tier-vocabulary-dead-keys`, `model-policy-tier-coverage`, `coordination-protocol-dead-vocabulary`) và dead vocabulary guard bảo vệ cấu trúc.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_c7fbd134619006f07ca2281f69601c5d

Source digest: d0b9dc422c288c90827e052e3925c863364d5c1da85bdc9b591861a9fa4b5e82

Target digest: d0b9dc422c288c90827e052e3925c863364d5c1da85bdc9b591861a9fa4b5e82

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-313",
  "sourceLines": [
    3090,
    3099
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0046 — Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-172",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0046 — Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng"
  ],
  "nativeTargetClaimId": "claim_85538107e647b0518597cf52f40bd546",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c7fbd134619006f07ca2281f69601c5d",
    "sourceUnitDigest": "d0b9dc422c288c90827e052e3925c863364d5c1da85bdc9b591861a9fa4b5e82",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-172",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-313 (lines 3090–3099) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-172. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d0b9dc422c288c90827e052e3925c863364d5c1da85bdc9b591861a9fa4b5e82",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0046 — Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (Phase 1–4 hoàn tất, 2026-10-01)
- **Bối cảnh:** Câu hỏi "bước này dùng model mạnh tới đâu" từng bị chồng chéo bởi 10 khái niệm (`size`/work tier, `runner.models`, `tier`/`minTier`, `modelPolicies`, `rigor`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, PlacementPolicy shadow). Ba track trước làm theo kiểu additive + shadow, không xoá, dẫn đến tích tụ lớp chồng.
- **Quyết định:**
  1. Bên cầu chỉ dùng `rigor` (`low|standard|high|critical`); bên cung chỉ dùng `tier` (`nano|mini|standard|advanced|flagship|frontier`) qua `rigorToTier`.
  2. Một resolver duy nhất: `resolveTierModel(cfg, tier, provider)`.
  3. Xoá vĩnh viễn: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `runner.models`, `capabilities.*.overrides`.
  4. Sàn theo loại việc `capabilities.<cap>.rigor`, merge chỉ-nâng với provenance `rigorSource: capability`.
  5. Tách `work.tier` thành `work.size` (độ lớn, không tới model) và `work.rigor` (tuỳ chọn, discovery phán); đường đọc duy nhất map event cũ `tier → size` và `risk: heavy` → `rigor: high`. Snapshot `state.json` mang `viewSchemaVersion: 2`.
  6. Doctor checks (`tier-vocabulary-dead-keys`, `model-policy-tier-coverage`, `coordination-protocol-dead-vocabulary`) và dead vocabulary guard bảo vệ cấu trúc.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (Phase 1–4 hoàn tất, 2026-10-01)
- **Bối cảnh:** Câu hỏi "bước này dùng model mạnh tới đâu" từng bị chồng chéo bởi 10 khái niệm (`size`/work tier, `runner.models`, `tier`/`minTier`, `modelPolicies`, `rigor`, `minRigor`, `mode`, `QUALITY_TIER_BRIDGE`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, PlacementPolicy shadow). Ba track trước làm theo kiểu additive + shadow, không xoá, dẫn đến tích tụ lớp chồng.
- **Quyết định:**
  1. Bên cầu chỉ dùng `rigor` (`low|standard|high|critical`); bên cung chỉ dùng `tier` (`nano|mini|standard|advanced|flagship|frontier`) qua `rigorToTier`.
  2. Một resolver duy nhất: `resolveTierModel(cfg, tier, provider)`.
  3. Xoá vĩnh viễn: `minTier`, `minRigor`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `DEFAULT_TIER_TO_POLICY`, `rigorOverrides`, `runner.models`, `capabilities.*.overrides`.
  4. Sàn theo loại việc `capabilities.<cap>.rigor`, merge chỉ-nâng với provenance `rigorSource: capability`.
  5. Tách `work.tier` thành `work.size` (độ lớn, không tới model) và `work.rigor` (tuỳ chọn, discovery phán); đường đọc duy nhất map event cũ `tier → size` và `risk: heavy` → `rigor: high`. Snapshot `state.json` mang `viewSchemaVersion: 2`.
  6. Doctor checks (`tier-vocabulary-dead-keys`, `model-policy-tier-coverage`, `coordination-protocol-dead-vocabulary`) và dead vocabulary guard bảo vệ cấu trúc.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_de96b9e2eda969f6cf15d3c98779e1ee

Source digest: 7a82fc342dbc99f94ab1d7f5cb7b99e4f1d2fb4e701626cfe52efea70c0169da

Target digest: 7a82fc342dbc99f94ab1d7f5cb7b99e4f1d2fb4e701626cfe52efea70c0169da

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
  "sourceLines": [
    3101,
    3101
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_66722d5ea270be5e47309df096dcbd72",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [
    {
      "oldSource": "docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5",
      "oldTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5",
      "currentSource": "docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "currentTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "originalRow": "| `docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5` | `docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5` | decision | split | Direct units of this heading only; nested headings have their own explicit row. Original headings retained; any new subdivision is Added in candidate. Source blob: `473a009662f22fb5d745e6ae151136da324d0d5e`. |",
      "rule": "P2 Lead decision: rebind stale source and target anchors; old row recorded as rebinding receipt, ownership now in additive current-heading row."
    }
  ],
  "decision": {
    "claimId": "claim_de96b9e2eda969f6cf15d3c98779e1ee",
    "sourceUnitDigest": "7a82fc342dbc99f94ab1d7f5cb7b99e4f1d2fb4e701626cfe52efea70c0169da",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061 (lines 3101–3101) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7a82fc342dbc99f94ab1d7f5cb7b99e4f1d2fb4e701626cfe52efea70c0169da",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0047 — P1 Lõi thực thi: Unit, một bind(), một cửa chạy fgos run, 3 Pattern cộng tác, đóng 4 mối authority L5 [§1 ĐÃ BỊ THAY MỘT PHẦN bởi 0061]

- **Trạng thái:** Settled (Request-to-Run P1 Execution Core hoàn tất, 2026-10-01)
- **Bối cảnh:** L5 trước P1 bị phân mảnh: "ai làm" bị quyết định ở nhiều nơi (coordination engine, `decide`, placement-policy, `assignment-policy.mjs`); "chạy qua cửa nào" có nhiều cửa ad-hoc; read-only bị chia rẽ giữa invocation `*-readonly` và tool gating; cổng ghi file phụ thuộc template stamp của engine.
- **Quyết định:**
  1. **Hợp đồng Unit (`src/runner/execution/unit.mjs`):** Hợp đồng dữ liệu duy nhất cho mọi đường vào. Phi hạ tầng (G2) — cấm chứa executor/provider/model/tier/invocation/actors/prefer/overrides.
  2. **Một `bind()` duy nhất (`src/runner/execution/bind.mjs`):** Bảng 5 mức (Session -> Overrides -> Unit role/rigor -> Project taste -> Global taste), tái dùng `mechanism.mjs` theo D-ADR0033 (một cơ chế dispatch).
  3. **Một cửa chạy `fgos run` (`src/runner/execution/run.mjs`):** Bọc `executeAssignment`, mặc định spawn qua pane herdr (G7), cli fallback. Có `fgos run record` cho producer inline với nonce một lần phát kèm chỉ dẫn và kiểm chứng `evidenceRefs`.
  4. **3 Pattern cộng tác (`solo`, `reviewed`, `panel`):** Vòng lặp code nhỏ, thuần, không store mới (Q-B: trạng thái vòng lặp suy từ `history()` của Unit run). `findings` là outcome, không đánh `failed`.
  5. **Cổng ghi file kiểm chứng được (supersede ADR-006 §6):** Assignment `mutating` được admit khi: (a) cwd là linked worktree và `realpath(cwd) == unit.json.worktree`, (b) `bind()` tính lại từ `unit.json` khớp deep-equal. Ngoại lệ có tên: engine protocol stamp giữ tới P4 phase 6. D-ADR0033 (một cơ chế dispatch) giữ nguyên.
  6. **Xoá bỏ hoàn toàn:** Invocations `*-readonly`, `readOnlyRedirects`, `placement-policy.mjs`. `executors.*.for` và PolicyPatch `preferExecutor`/`preferPersona` vẫn được lớp dispatch đọc tại `src/runner/dispatch/resolve.mjs` (`resolveCapabilityDetailsFromHints`) và `src/runner/dispatch/assignment-policy.mjs`; không phải các trường đã xoá. Đường Execution Core chọn executor qua `bind()` với overrides và `capabilities.*.prefer` (`src/runner/execution/bind.mjs`). Posture read-only/ghi file là confinement OS do fgOS áp cho cả herdr lẫn cli (X-1). Quota limit `provider-limit` kích hoạt `bind().nextCandidate` mở pane mới giữ pane cũ (X-3).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0047 — P1 Lõi thực thi: Unit, một bind(), một cửa chạy fgos run, 3 Pattern cộng tác, đóng 4 mối authority L5 [§1 ĐÃ BỊ THAY MỘT PHẦN bởi 0061]

- **Trạng thái:** Settled (Request-to-Run P1 Execution Core hoàn tất, 2026-10-01)
- **Bối cảnh:** L5 trước P1 bị phân mảnh: "ai làm" bị quyết định ở nhiều nơi (coordination engine, `decide`, placement-policy, `assignment-policy.mjs`); "chạy qua cửa nào" có nhiều cửa ad-hoc; read-only bị chia rẽ giữa invocation `*-readonly` và tool gating; cổng ghi file phụ thuộc template stamp của engine.
- **Quyết định:**
  1. **Hợp đồng Unit (`src/runner/execution/unit.mjs`):** Hợp đồng dữ liệu duy nhất cho mọi đường vào. Phi hạ tầng (G2) — cấm chứa executor/provider/model/tier/invocation/actors/prefer/overrides.
  2. **Một `bind()` duy nhất (`src/runner/execution/bind.mjs`):** Bảng 5 mức (Session -> Overrides -> Unit role/rigor -> Project taste -> Global taste), tái dùng `mechanism.mjs` theo D-ADR0033 (một cơ chế dispatch).
  3. **Một cửa chạy `fgos run` (`src/runner/execution/run.mjs`):** Bọc `executeAssignment`, mặc định spawn qua pane herdr (G7), cli fallback. Có `fgos run record` cho producer inline với nonce một lần phát kèm chỉ dẫn và kiểm chứng `evidenceRefs`.
  4. **3 Pattern cộng tác (`solo`, `reviewed`, `panel`):** Vòng lặp code nhỏ, thuần, không store mới (Q-B: trạng thái vòng lặp suy từ `history()` của Unit run). `findings` là outcome, không đánh `failed`.
  5. **Cổng ghi file kiểm chứng được (supersede ADR-006 §6):** Assignment `mutating` được admit khi: (a) cwd là linked worktree và `realpath(cwd) == unit.json.worktree`, (b) `bind()` tính lại từ `unit.json` khớp deep-equal. Ngoại lệ có tên: engine protocol stamp giữ tới P4 phase 6. D-ADR0033 (một cơ chế dispatch) giữ nguyên.
  6. **Xoá bỏ hoàn toàn:** Invocations `*-readonly`, `readOnlyRedirects`, `placement-policy.mjs`. `executors.*.for` và PolicyPatch `preferExecutor`/`preferPersona` vẫn được lớp dispatch đọc tại `src/runner/dispatch/resolve.mjs` (`resolveCapabilityDetailsFromHints`) và `src/runner/dispatch/assignment-policy.mjs`; không phải các trường đã xoá. Đường Execution Core chọn executor qua `bind()` với overrides và `capabilities.*.prefer` (`src/runner/execution/bind.mjs`). Posture read-only/ghi file là confinement OS do fgOS áp cho cả herdr lẫn cli (X-1). Quota limit `provider-limit` kích hoạt `bind().nextCandidate` mở pane mới giữ pane cũ (X-3).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_65ec90fc672e6d1a8dff764c3e3dd516

Source digest: 7518a36eebda7c6697541c1dbcfba86b9d00018685cd6f34a0abf6d6a3c8bc27

Target digest: 7518a36eebda7c6697541c1dbcfba86b9d00018685cd6f34a0abf6d6a3c8bc27

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-314",
  "sourceLines": [
    3103,
    3112
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0047 — P1 Lõi thực thi: Unit, một bind(), một cửa chạy fgos run, 3 Pattern cộng tác, đóng 4 mối authority L5 [§1 ĐÃ BỊ THAY MỘT PHẦN bởi 0061]"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-173",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0047 — P1 Lõi thực thi: Unit, một bind(), một cửa chạy fgos run, 3 Pattern cộng tác, đóng 4 mối authority L5 [§1 ĐÃ BỊ THAY MỘT PHẦN bởi 0061]"
  ],
  "nativeTargetClaimId": "claim_8b518c7ffad123c4287b9b7149fef26a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [
    {
      "oldSource": "docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5",
      "oldTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5",
      "currentSource": "docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "currentTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061",
      "originalRow": "| `docs/specs/runner.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5` | `docs/platform/runner/decisions/h-36d872fbb0e5.md#0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5` | decision | split | Direct units of this heading only; nested headings have their own explicit row. Original headings retained; any new subdivision is Added in candidate. Source blob: `473a009662f22fb5d745e6ae151136da324d0d5e`. |",
      "rule": "P2 Lead decision: rebind stale source and target anchors; old row recorded as rebinding receipt, ownership now in additive current-heading row."
    }
  ],
  "decision": {
    "claimId": "claim_65ec90fc672e6d1a8dff764c3e3dd516",
    "sourceUnitDigest": "7518a36eebda7c6697541c1dbcfba86b9d00018685cd6f34a0abf6d6a3c8bc27",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-173",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-314 (lines 3103–3112) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-173. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7518a36eebda7c6697541c1dbcfba86b9d00018685cd6f34a0abf6d6a3c8bc27",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0047 — P1 Lõi thực thi: Unit, một bind(), một cửa chạy fgos run, 3 Pattern cộng tác, đóng 4 mối authority L5 [§1 ĐÃ BỊ THAY MỘT PHẦN bởi 0061]"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (Request-to-Run P1 Execution Core hoàn tất, 2026-10-01)
- **Bối cảnh:** L5 trước P1 bị phân mảnh: "ai làm" bị quyết định ở nhiều nơi (coordination engine, `decide`, placement-policy, `assignment-policy.mjs`); "chạy qua cửa nào" có nhiều cửa ad-hoc; read-only bị chia rẽ giữa invocation `*-readonly` và tool gating; cổng ghi file phụ thuộc template stamp của engine.
- **Quyết định:**
  1. **Hợp đồng Unit (`src/runner/execution/unit.mjs`):** Hợp đồng dữ liệu duy nhất cho mọi đường vào. Phi hạ tầng (G2) — cấm chứa executor/provider/model/tier/invocation/actors/prefer/overrides.
  2. **Một `bind()` duy nhất (`src/runner/execution/bind.mjs`):** Bảng 5 mức (Session -> Overrides -> Unit role/rigor -> Project taste -> Global taste), tái dùng `mechanism.mjs` theo D-ADR0033 (một cơ chế dispatch).
  3. **Một cửa chạy `fgos run` (`src/runner/execution/run.mjs`):** Bọc `executeAssignment`, mặc định spawn qua pane herdr (G7), cli fallback. Có `fgos run record` cho producer inline với nonce một lần phát kèm chỉ dẫn và kiểm chứng `evidenceRefs`.
  4. **3 Pattern cộng tác (`solo`, `reviewed`, `panel`):** Vòng lặp code nhỏ, thuần, không store mới (Q-B: trạng thái vòng lặp suy từ `history()` của Unit run). `findings` là outcome, không đánh `failed`.
  5. **Cổng ghi file kiểm chứng được (supersede ADR-006 §6):** Assignment `mutating` được admit khi: (a) cwd là linked worktree và `realpath(cwd) == unit.json.worktree`, (b) `bind()` tính lại từ `unit.json` khớp deep-equal. Ngoại lệ có tên: engine protocol stamp giữ tới P4 phase 6. D-ADR0033 (một cơ chế dispatch) giữ nguyên.
  6. **Xoá bỏ hoàn toàn:** Invocations `*-readonly`, `readOnlyRedirects`, `placement-policy.mjs`. `executors.*.for` và PolicyPatch `preferExecutor`/`preferPersona` vẫn được lớp dispatch đọc tại `src/runner/dispatch/resolve.mjs` (`resolveCapabilityDetailsFromHints`) và `src/runner/dispatch/assignment-policy.mjs`; không phải các trường đã xoá. Đường Execution Core chọn executor qua `bind()` với overrides và `capabilities.*.prefer` (`src/runner/execution/bind.mjs`). Posture read-only/ghi file là confinement OS do fgOS áp cho cả herdr lẫn cli (X-1). Quota limit `provider-limit` kích hoạt `bind().nextCandidate` mở pane mới giữ pane cũ (X-3).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (Request-to-Run P1 Execution Core hoàn tất, 2026-10-01)
- **Bối cảnh:** L5 trước P1 bị phân mảnh: "ai làm" bị quyết định ở nhiều nơi (coordination engine, `decide`, placement-policy, `assignment-policy.mjs`); "chạy qua cửa nào" có nhiều cửa ad-hoc; read-only bị chia rẽ giữa invocation `*-readonly` và tool gating; cổng ghi file phụ thuộc template stamp của engine.
- **Quyết định:**
  1. **Hợp đồng Unit (`src/runner/execution/unit.mjs`):** Hợp đồng dữ liệu duy nhất cho mọi đường vào. Phi hạ tầng (G2) — cấm chứa executor/provider/model/tier/invocation/actors/prefer/overrides.
  2. **Một `bind()` duy nhất (`src/runner/execution/bind.mjs`):** Bảng 5 mức (Session -> Overrides -> Unit role/rigor -> Project taste -> Global taste), tái dùng `mechanism.mjs` theo D-ADR0033 (một cơ chế dispatch).
  3. **Một cửa chạy `fgos run` (`src/runner/execution/run.mjs`):** Bọc `executeAssignment`, mặc định spawn qua pane herdr (G7), cli fallback. Có `fgos run record` cho producer inline với nonce một lần phát kèm chỉ dẫn và kiểm chứng `evidenceRefs`.
  4. **3 Pattern cộng tác (`solo`, `reviewed`, `panel`):** Vòng lặp code nhỏ, thuần, không store mới (Q-B: trạng thái vòng lặp suy từ `history()` của Unit run). `findings` là outcome, không đánh `failed`.
  5. **Cổng ghi file kiểm chứng được (supersede ADR-006 §6):** Assignment `mutating` được admit khi: (a) cwd là linked worktree và `realpath(cwd) == unit.json.worktree`, (b) `bind()` tính lại từ `unit.json` khớp deep-equal. Ngoại lệ có tên: engine protocol stamp giữ tới P4 phase 6. D-ADR0033 (một cơ chế dispatch) giữ nguyên.
  6. **Xoá bỏ hoàn toàn:** Invocations `*-readonly`, `readOnlyRedirects`, `placement-policy.mjs`. `executors.*.for` và PolicyPatch `preferExecutor`/`preferPersona` vẫn được lớp dispatch đọc tại `src/runner/dispatch/resolve.mjs` (`resolveCapabilityDetailsFromHints`) và `src/runner/dispatch/assignment-policy.mjs`; không phải các trường đã xoá. Đường Execution Core chọn executor qua `bind()` với overrides và `capabilities.*.prefer` (`src/runner/execution/bind.mjs`). Posture read-only/ghi file là confinement OS do fgOS áp cho cả herdr lẫn cli (X-1). Quota limit `provider-limit` kích hoạt `bind().nextCandidate` mở pane mới giữ pane cũ (X-3).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_8f31a4f2f6b6f91fcbf89cace7be6bff

Source digest: 8accf2e712bcb94cb1052b33924b384edab96c8628c5400f7d096efcf09cded1

Target digest: 8accf2e712bcb94cb1052b33924b384edab96c8628c5400f7d096efcf09cded1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher",
  "sourceLines": [
    3114,
    3114
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_88ead6c5265273d248880e3898ec5970",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8f31a4f2f6b6f91fcbf89cace7be6bff",
    "sourceUnitDigest": "8accf2e712bcb94cb1052b33924b384edab96c8628c5400f7d096efcf09cded1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher (lines 3114–3114) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8accf2e712bcb94cb1052b33924b384edab96c8628c5400f7d096efcf09cded1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0048 — P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng fgos-run, bỏ DemandFacts/matcher

- **Trạng thái:** Settled (Request-to-Run P2 Runnable Plans hoàn tất, 2026-10-01)
- **Bối cảnh:** Trước P2, việc phân rã và chọn capability/cơ chế bị phân mảnh bởi lớp prose L2 DemandFacts (8 fields) -> matcher -> `form` (`inline|protocol|facade`). Các facade `fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop` tự lập lịch, tự chạy vòng lặp bằng prose, tạo ra nhiều sequencer chồng chéo và gắn chặt vào domain coding.
- **Quyết định:**
  1. **Unit là hợp đồng dữ liệu duy nhất (`src/runner/execution/unit.mjs`):** Mọi đường vào (prompt tự do, plan AgentKit, phase file) đều quy về Unit. `fgos plan-lint` kiểm chứng Unit trong phase file (`## Units`, `- unit:`), phát hiện sớm ghim hạ tầng (G2), trùng id, vòng phụ thuộc, và giao nhau `writes` không có `dependsOn`.
  2. **Driver mỏng (`core/skills/fgos-run`):** Thay thế toàn bộ các facade cũ (`fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`, `fgos-capability-dispatching`). Driver không tự lập lịch, không tự merge mà giao trọn cho **Workflow runner** (`src/workflow/runner.mjs`, P3a).
  3. **Cổng người thống nhất:** Authorize không parse từ prose plan. Phase chưa được duyệt sẽ dừng ở cổng người của Workflow run (`gate: { kind: "human" }`), owner trả lời qua `fgos workflow answer`. Mọi câu hỏi treo được gom thành một bộ duy nhất. Mọi cổng người mặc định là consent gate (`mode: "consent"`, fail-closed): chỉ nhả runner khi trả lời kèm `--approve`; trả lời không có `--approve` là lời làm rõ (clarification note) và gate giữ nguyên `parked`. Cổng nào chủ động khai `mode: "input"` thì câu trả lời nội dung là đủ để tiến bước.
  4. **Xoá bỏ DemandFacts & matcher:** Xoá `src/runner/capability-match.mjs`, verb `fgos capability match`, các fragment `capability-matching.md`. L2 chỉ còn hiểu yêu cầu và viết Unit với `capability` (`domain:verb`).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0048 — P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng fgos-run, bỏ DemandFacts/matcher

- **Trạng thái:** Settled (Request-to-Run P2 Runnable Plans hoàn tất, 2026-10-01)
- **Bối cảnh:** Trước P2, việc phân rã và chọn capability/cơ chế bị phân mảnh bởi lớp prose L2 DemandFacts (8 fields) -> matcher -> `form` (`inline|protocol|facade`). Các facade `fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop` tự lập lịch, tự chạy vòng lặp bằng prose, tạo ra nhiều sequencer chồng chéo và gắn chặt vào domain coding.
- **Quyết định:**
  1. **Unit là hợp đồng dữ liệu duy nhất (`src/runner/execution/unit.mjs`):** Mọi đường vào (prompt tự do, plan AgentKit, phase file) đều quy về Unit. `fgos plan-lint` kiểm chứng Unit trong phase file (`## Units`, `- unit:`), phát hiện sớm ghim hạ tầng (G2), trùng id, vòng phụ thuộc, và giao nhau `writes` không có `dependsOn`.
  2. **Driver mỏng (`core/skills/fgos-run`):** Thay thế toàn bộ các facade cũ (`fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`, `fgos-capability-dispatching`). Driver không tự lập lịch, không tự merge mà giao trọn cho **Workflow runner** (`src/workflow/runner.mjs`, P3a).
  3. **Cổng người thống nhất:** Authorize không parse từ prose plan. Phase chưa được duyệt sẽ dừng ở cổng người của Workflow run (`gate: { kind: "human" }`), owner trả lời qua `fgos workflow answer`. Mọi câu hỏi treo được gom thành một bộ duy nhất. Mọi cổng người mặc định là consent gate (`mode: "consent"`, fail-closed): chỉ nhả runner khi trả lời kèm `--approve`; trả lời không có `--approve` là lời làm rõ (clarification note) và gate giữ nguyên `parked`. Cổng nào chủ động khai `mode: "input"` thì câu trả lời nội dung là đủ để tiến bước.
  4. **Xoá bỏ DemandFacts & matcher:** Xoá `src/runner/capability-match.mjs`, verb `fgos capability match`, các fragment `capability-matching.md`. L2 chỉ còn hiểu yêu cầu và viết Unit với `capability` (`domain:verb`).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_6f695d26a139ec834153e132e8024107

Source digest: 715faf8184937613283eecfb3043d6da73c2aec15278e160e579e5d655f940a9

Target digest: 715faf8184937613283eecfb3043d6da73c2aec15278e160e579e5d655f940a9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-315",
  "sourceLines": [
    3116,
    3123
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0048 — P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng fgos-run, bỏ DemandFacts/matcher"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-174",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0048 — P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng fgos-run, bỏ DemandFacts/matcher"
  ],
  "nativeTargetClaimId": "claim_ec86d7697c28281dadaed2f1d0aa43fb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6f695d26a139ec834153e132e8024107",
    "sourceUnitDigest": "715faf8184937613283eecfb3043d6da73c2aec15278e160e579e5d655f940a9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-174",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-315 (lines 3116–3123) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-174. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "715faf8184937613283eecfb3043d6da73c2aec15278e160e579e5d655f940a9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0048 — P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng fgos-run, bỏ DemandFacts/matcher"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (Request-to-Run P2 Runnable Plans hoàn tất, 2026-10-01)
- **Bối cảnh:** Trước P2, việc phân rã và chọn capability/cơ chế bị phân mảnh bởi lớp prose L2 DemandFacts (8 fields) -> matcher -> `form` (`inline|protocol|facade`). Các facade `fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop` tự lập lịch, tự chạy vòng lặp bằng prose, tạo ra nhiều sequencer chồng chéo và gắn chặt vào domain coding.
- **Quyết định:**
  1. **Unit là hợp đồng dữ liệu duy nhất (`src/runner/execution/unit.mjs`):** Mọi đường vào (prompt tự do, plan AgentKit, phase file) đều quy về Unit. `fgos plan-lint` kiểm chứng Unit trong phase file (`## Units`, `- unit:`), phát hiện sớm ghim hạ tầng (G2), trùng id, vòng phụ thuộc, và giao nhau `writes` không có `dependsOn`.
  2. **Driver mỏng (`core/skills/fgos-run`):** Thay thế toàn bộ các facade cũ (`fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`, `fgos-capability-dispatching`). Driver không tự lập lịch, không tự merge mà giao trọn cho **Workflow runner** (`src/workflow/runner.mjs`, P3a).
  3. **Cổng người thống nhất:** Authorize không parse từ prose plan. Phase chưa được duyệt sẽ dừng ở cổng người của Workflow run (`gate: { kind: "human" }`), owner trả lời qua `fgos workflow answer`. Mọi câu hỏi treo được gom thành một bộ duy nhất. Mọi cổng người mặc định là consent gate (`mode: "consent"`, fail-closed): chỉ nhả runner khi trả lời kèm `--approve`; trả lời không có `--approve` là lời làm rõ (clarification note) và gate giữ nguyên `parked`. Cổng nào chủ động khai `mode: "input"` thì câu trả lời nội dung là đủ để tiến bước.
  4. **Xoá bỏ DemandFacts & matcher:** Xoá `src/runner/capability-match.mjs`, verb `fgos capability match`, các fragment `capability-matching.md`. L2 chỉ còn hiểu yêu cầu và viết Unit với `capability` (`domain:verb`).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (Request-to-Run P2 Runnable Plans hoàn tất, 2026-10-01)
- **Bối cảnh:** Trước P2, việc phân rã và chọn capability/cơ chế bị phân mảnh bởi lớp prose L2 DemandFacts (8 fields) -> matcher -> `form` (`inline|protocol|facade`). Các facade `fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop` tự lập lịch, tự chạy vòng lặp bằng prose, tạo ra nhiều sequencer chồng chéo và gắn chặt vào domain coding.
- **Quyết định:**
  1. **Unit là hợp đồng dữ liệu duy nhất (`src/runner/execution/unit.mjs`):** Mọi đường vào (prompt tự do, plan AgentKit, phase file) đều quy về Unit. `fgos plan-lint` kiểm chứng Unit trong phase file (`## Units`, `- unit:`), phát hiện sớm ghim hạ tầng (G2), trùng id, vòng phụ thuộc, và giao nhau `writes` không có `dependsOn`.
  2. **Driver mỏng (`core/skills/fgos-run`):** Thay thế toàn bộ các facade cũ (`fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`, `fgos-capability-dispatching`). Driver không tự lập lịch, không tự merge mà giao trọn cho **Workflow runner** (`src/workflow/runner.mjs`, P3a).
  3. **Cổng người thống nhất:** Authorize không parse từ prose plan. Phase chưa được duyệt sẽ dừng ở cổng người của Workflow run (`gate: { kind: "human" }`), owner trả lời qua `fgos workflow answer`. Mọi câu hỏi treo được gom thành một bộ duy nhất. Mọi cổng người mặc định là consent gate (`mode: "consent"`, fail-closed): chỉ nhả runner khi trả lời kèm `--approve`; trả lời không có `--approve` là lời làm rõ (clarification note) và gate giữ nguyên `parked`. Cổng nào chủ động khai `mode: "input"` thì câu trả lời nội dung là đủ để tiến bước.
  4. **Xoá bỏ DemandFacts & matcher:** Xoá `src/runner/capability-match.mjs`, verb `fgos capability match`, các fragment `capability-matching.md`. L2 chỉ còn hiểu yêu cầu và viết Unit với `capability` (`domain:verb`).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_5f10674a9a170a84bfd02d6b1462ea18

Source digest: a79a3012b22c033bb7e482e94239462054434386e4f2c010c9346577130e1a8d

Target digest: a79a3012b22c033bb7e482e94239462054434386e4f2c010c9346577130e1a8d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4",
  "sourceLines": [
    3125,
    3125
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_f8129913e35b81abe08c3e23d8068d92",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5f10674a9a170a84bfd02d6b1462ea18",
    "sourceUnitDigest": "a79a3012b22c033bb7e482e94239462054434386e4f2c010c9346577130e1a8d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4 (lines 3125–3125) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a79a3012b22c033bb7e482e94239462054434386e4f2c010c9346577130e1a8d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0049 — P3b Work không còn stage: Work chỉ còn bản ghi/lifecycle, Workflow runner là sequencer duy nhất, đóng A4

- **Trạng thái:** Settled (Request-to-Run P3b hoàn tất, 2026-10-02)
- **Bối cảnh:** Trước P3, Work mang trường `stage`, và dispatch đọc thẳng stage/workflow của Work (vi phạm A4). Điều này khiến logic tuần tự bước bị phân tán giữa `loop.mjs`, FSM stage, và prose của skill, đồng thời kéo dispatch phụ thuộc vào state.
- **Quyết định:**
  1. **Work không còn `stage`:** Work trở về đúng bản chất là bản ghi yêu cầu, bảng tiến độ và FSM trạng thái (status lifecycle). Thêm `workflowRunId?` để trỏ tới phiên chạy Workflow độc lập.
  2. **Một đường đọc dữ liệu cũ:** Replay map các event `stage` lịch sử sang `workflowStep` mà không ghi đè dữ liệu cũ. Bump `viewSchemaVersion: 3` (Rust và Node đọc tương thích cả 2 và 3).
  3. **Đóng ranh giới A4 (L5 không phụ thuộc L3):** Xoá sạch toàn bộ import `src/state/**` khỏi `src/runner/dispatch/**` và `src/runner/execution/**`. Xoá writer `dispatch-runs` và các reader cũ.
  4. **Thu hồi adapter Workflow cũ:** Xoá `src/runner/definitions/workflow-adapter.mjs`, bỏ profile `Workflow` khỏi `FlowDefinition`, xoá doctor check `workflow-flow-definition-projects-cleanly`. Workflow runner (`src/workflow/**`) là sequencer duy nhất.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0049 — P3b Work không còn stage: Work chỉ còn bản ghi/lifecycle, Workflow runner là sequencer duy nhất, đóng A4

- **Trạng thái:** Settled (Request-to-Run P3b hoàn tất, 2026-10-02)
- **Bối cảnh:** Trước P3, Work mang trường `stage`, và dispatch đọc thẳng stage/workflow của Work (vi phạm A4). Điều này khiến logic tuần tự bước bị phân tán giữa `loop.mjs`, FSM stage, và prose của skill, đồng thời kéo dispatch phụ thuộc vào state.
- **Quyết định:**
  1. **Work không còn `stage`:** Work trở về đúng bản chất là bản ghi yêu cầu, bảng tiến độ và FSM trạng thái (status lifecycle). Thêm `workflowRunId?` để trỏ tới phiên chạy Workflow độc lập.
  2. **Một đường đọc dữ liệu cũ:** Replay map các event `stage` lịch sử sang `workflowStep` mà không ghi đè dữ liệu cũ. Bump `viewSchemaVersion: 3` (Rust và Node đọc tương thích cả 2 và 3).
  3. **Đóng ranh giới A4 (L5 không phụ thuộc L3):** Xoá sạch toàn bộ import `src/state/**` khỏi `src/runner/dispatch/**` và `src/runner/execution/**`. Xoá writer `dispatch-runs` và các reader cũ.
  4. **Thu hồi adapter Workflow cũ:** Xoá `src/runner/definitions/workflow-adapter.mjs`, bỏ profile `Workflow` khỏi `FlowDefinition`, xoá doctor check `workflow-flow-definition-projects-cleanly`. Workflow runner (`src/workflow/**`) là sequencer duy nhất.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_5348a42561949a4c0042f0196fe52f56

Source digest: 657e5b15bf7f9f37215c2f5ee49bc8e3138f6c678dc74b8d68a051604c85cd71

Target digest: 657e5b15bf7f9f37215c2f5ee49bc8e3138f6c678dc74b8d68a051604c85cd71

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-316",
  "sourceLines": [
    3127,
    3134
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0049 — P3b Work không còn stage: Work chỉ còn bản ghi/lifecycle, Workflow runner là sequencer duy nhất, đóng A4"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-175",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0049 — P3b Work không còn stage: Work chỉ còn bản ghi/lifecycle, Workflow runner là sequencer duy nhất, đóng A4"
  ],
  "nativeTargetClaimId": "claim_f4b4d62fdde071bd4b584301b3ef594d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5348a42561949a4c0042f0196fe52f56",
    "sourceUnitDigest": "657e5b15bf7f9f37215c2f5ee49bc8e3138f6c678dc74b8d68a051604c85cd71",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-175",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-316 (lines 3127–3134) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-175. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "657e5b15bf7f9f37215c2f5ee49bc8e3138f6c678dc74b8d68a051604c85cd71",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0049 — P3b Work không còn stage: Work chỉ còn bản ghi/lifecycle, Workflow runner là sequencer duy nhất, đóng A4"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (Request-to-Run P3b hoàn tất, 2026-10-02)
- **Bối cảnh:** Trước P3, Work mang trường `stage`, và dispatch đọc thẳng stage/workflow của Work (vi phạm A4). Điều này khiến logic tuần tự bước bị phân tán giữa `loop.mjs`, FSM stage, và prose của skill, đồng thời kéo dispatch phụ thuộc vào state.
- **Quyết định:**
  1. **Work không còn `stage`:** Work trở về đúng bản chất là bản ghi yêu cầu, bảng tiến độ và FSM trạng thái (status lifecycle). Thêm `workflowRunId?` để trỏ tới phiên chạy Workflow độc lập.
  2. **Một đường đọc dữ liệu cũ:** Replay map các event `stage` lịch sử sang `workflowStep` mà không ghi đè dữ liệu cũ. Bump `viewSchemaVersion: 3` (Rust và Node đọc tương thích cả 2 và 3).
  3. **Đóng ranh giới A4 (L5 không phụ thuộc L3):** Xoá sạch toàn bộ import `src/state/**` khỏi `src/runner/dispatch/**` và `src/runner/execution/**`. Xoá writer `dispatch-runs` và các reader cũ.
  4. **Thu hồi adapter Workflow cũ:** Xoá `src/runner/definitions/workflow-adapter.mjs`, bỏ profile `Workflow` khỏi `FlowDefinition`, xoá doctor check `workflow-flow-definition-projects-cleanly`. Workflow runner (`src/workflow/**`) là sequencer duy nhất.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (Request-to-Run P3b hoàn tất, 2026-10-02)
- **Bối cảnh:** Trước P3, Work mang trường `stage`, và dispatch đọc thẳng stage/workflow của Work (vi phạm A4). Điều này khiến logic tuần tự bước bị phân tán giữa `loop.mjs`, FSM stage, và prose của skill, đồng thời kéo dispatch phụ thuộc vào state.
- **Quyết định:**
  1. **Work không còn `stage`:** Work trở về đúng bản chất là bản ghi yêu cầu, bảng tiến độ và FSM trạng thái (status lifecycle). Thêm `workflowRunId?` để trỏ tới phiên chạy Workflow độc lập.
  2. **Một đường đọc dữ liệu cũ:** Replay map các event `stage` lịch sử sang `workflowStep` mà không ghi đè dữ liệu cũ. Bump `viewSchemaVersion: 3` (Rust và Node đọc tương thích cả 2 và 3).
  3. **Đóng ranh giới A4 (L5 không phụ thuộc L3):** Xoá sạch toàn bộ import `src/state/**` khỏi `src/runner/dispatch/**` và `src/runner/execution/**`. Xoá writer `dispatch-runs` và các reader cũ.
  4. **Thu hồi adapter Workflow cũ:** Xoá `src/runner/definitions/workflow-adapter.mjs`, bỏ profile `Workflow` khỏi `FlowDefinition`, xoá doctor check `workflow-flow-definition-projects-cleanly`. Workflow runner (`src/workflow/**`) là sequencer duy nhất.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_65304cc9e0b7cd5027ee9a2589b612c8

Source digest: b5019011cdace996fa7f74d74340bbdc14ae0b3b5ae3f479975e336bccd9679f

Target digest: b5019011cdace996fa7f74d74340bbdc14ae0b3b5ae3f479975e336bccd9679f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới",
  "sourceLines": [
    3136,
    3136
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_2d83d8a1ea023831c1cb4d8232813f2c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_65304cc9e0b7cd5027ee9a2589b612c8",
    "sourceUnitDigest": "b5019011cdace996fa7f74d74340bbdc14ae0b3b5ae3f479975e336bccd9679f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới (lines 3136–3136) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b5019011cdace996fa7f74d74340bbdc14ae0b3b5ae3f479975e336bccd9679f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0050 — P6 Nối thật: herdr là transport mặc định, posture một đường, fallback quota qua pane mới

- **Trạng thái:** Settled cho ca 1, 2, 3, 4, 6; ca 5 NOT RUN (xem bằng chứng)
- **Bối cảnh:** Sau 0047, `bind().transport`, `resolvePosture` và `nextCandidate` tồn tại nhưng không ai gọi: mọi lần chạy thật là cli headless, posture tự dựng `bwrapArgs` riêng song song với driver confinement, `canApplyPosture` luôn `true`.
- **Quyết định:**
  1. **Transport do `bind()` quyết, `run.mjs` đọc.** herdr khi herdr có mặt trong session **và** executor có invocation `herdr-spawn` có id mà `canApplyPosture` chấp nhận; ngược lại cli (lý do ghi ở `provenance.transport.source`). Transport và invocation thật nằm trong `assignment.json` / `unit.json`, không chỉ ở giá trị trả về. Executor có CLI vẫn out-of-process (D-ADR0033 (một cơ chế dispatch, executor có CLI luôn chạy ngoài process)).
  2. **Posture một đường.** `resolvePosture` chỉ ánh xạ posture -> `requirement` (policy built-in); `requirement` đi vào `buildConfinementRequest` -> Confinement Authority -> driver bwrap, cho cả pane herdr lẫn cli. Không còn `bwrapArgs` tự dựng trong `policies.mjs` (guard test). `resolvePostureInvocation` (`canApplyPosture` là dạng boolean của nó) là nơi duy nhất quyết: invocation khai `confinement.backend`, backend bật trong registry máy, executable chạy được; thiếu thì bind lọc candidate hoặc từ chối `posture-unavailable`, không chạy không confine. Nó cũng trả về invocation đã duyệt: khi `prefer` không nêu invocation, bind ghi đúng invocation cli thường đầu tiên mang được posture (không phải invocation cli đầu tiên của executor; `herdr-spawn` chỉ tính khi session ở trong herdr) vào binding, và `run.mjs` ghim đúng nó. Entry `prefer` nêu invocation thì giữ nguyên. Nên mọi invocation muốn được chọn phải khai `confinement`, và invocation của agent ghi state ngoài thư mục chỉ-đọc (codex, agy, pi) phải khai thêm `resourceBindings` private-home.
  5. **Tra capability.** `bind()` tìm `capabilities[domain:verb]` trước, rồi `capabilities[verb]`, nhưng entry chỉ thắng khi có `prefer` dùng được: slot chỉ có `description` (loại `fgos setup` ghi) không che bare-verb có `prefer`. Không có `prefer` ở đâu cả thì headless bị từ chối `headless-no-executor`; `fgos doctor` (`workflow-capabilities-configured`) cảnh báo đúng capability đó. Mặc định headless chỉ chạy được với Workflow đã khai `prefer`, không phải mọi Workflow `fgos setup` đã ghi slot.
  3. **Fallback quota.** `provider-limit` (herdr đọc màn hình qua detector của herdr, mặc định idle 5 phút nếu config không đặt `idleTimeoutMs`) -> `nextCandidate` đi tiếp `prefer[]` -> pane mới dưới assignment id `<unitRun>/<role>/<round>-fb<n>`; pane cũ giữ nguyên; `fallbackFrom` ghi lại; hết candidate thì outcome vẫn `provider-limit`. cli-spawn không có phát hiện limit nên headless không fallback (*cập nhật 2026-10-14:* nay có, qua câu hạn mức ở đuôi stderr, xem đoạn decision 0058 ở RUL65b). Pane idle (không `working`) quá 15 giây bị đọc màn hình để tìm credential chết (`AUTH_FAILURE_PATTERNS`, vd pi "OAuth refresh failed ... invalid_grant"): thấy thì cũng kết thúc `provider-limit` ngay, không chờ idle timeout, để walk sang candidate kế; classifier ghi quarantine `auth-token` kiểu `manual-clear` (tới khi người login lại và `fgos dispatch reconcile provider-capacity clear-quarantine`), không phải `quota-limit`. Quarantine quota dùng đúng thời gian reset provider ghi trên màn hình ("Resets in 24m1s", cả giờ/phút/giây), mặc định 1 giờ khi không ghi.
  4. **Pane confine cho cả năm họ** (claude, claude qua OpenRouter, codex, agy, pi): mỗi agent giữ state trong private home dựng từ account được lease; công thức và lý do ở [confinement-authority.md §13.1](./confinement-authority.md), account inventory toàn máy ở RUL65b (trên).
  - **Pane không nhận HOME riêng của worker.** Vòng herdr confine mở pane không kèm `HOME` private (launcher script tự `export` nó trước khi `exec`): shell của pane mà bắt đầu trong một home không có file khởi động thì zsh chạy trình hướng dẫn lần đầu và nuốt lệnh khởi chạy gõ ngay sau, nên vòng agy báo `foreground process ... does not match prepared command argv` dù argv không sai.
  - **Prompt delivery trong pane herdr (`inline` mặc định, `file-pointer` tuỳ chọn).** Mặc định `herdr-spawn` gửi toàn bộ nội dung `brief-<round>.md` trực tiếp vào pane qua `herdr agent prompt` (bracketed paste) để người quan sát thấy trọn vẹn prompt trong TUI, đồng thời vẫn ghi `brief-<round>.md` xuống đĩa kèm dòng trỏ đường dẫn phục hồi sau compaction; `promptDelivery: "file-pointer"` (hoặc `FGOS_HERDR_PROMPT_DELIVERY=file-pointer`) giữ cơ chế gõ con trỏ một dòng. `confirmBriefSubmitted` nhận diện cả paste chip thu gọn (`[Pasted text #1 +N lines]`, `[paste #1 +N lines]`, `[Paste]`, `#1 … +N lines`, menu `Pasted N lines`) ở vùng composer cuối màn hình; `SHELL_MANAGED_ENV` giữ nguyên `TERM`/`HERDR_PANE_ID` của pane mới (không để `TERM=dumb` hay `HERDR_PANE_ID` của process gọi ghi đè), `workerBaseEnv` loại bỏ `OMPCODE`/`OMP_PROFILE`/`PI_PROFILE`/`PI_CONFIG_FILES` của phiên cha, và `executors.xai` có thêm invocation `omp-herdr-vantt` chạy `omp` trong pane `bwrap`.
- **Bằng chứng:** [acceptance-herdr.md](../../plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/acceptance-herdr.md): ca 1 (Unit `reviewed`), 2 (reviewer bị chặn ghi repo, ghi được outbox), 3 (Workflow `architecture-advisory` 9 role trong pane, 4 họ provider), 4 (fallback, pane cũ giữ), 6 (headless cli cùng posture) Accepted; transport đọc từ `assignment.json`.
- **Giới hạn đã biết:**
  - Ca 5 (so cùng câu hỏi với engine cũ, tag `pre-engine-retirement`) **NOT RUN**: engine cũ cần Lead tự viết và authorize từng bước, nên "Lead-active" sẽ đo chính thao tác tay, không đo engine.
  - Ca 4 dùng màn hình limit **giả** (executor `fake-limit`); `DEFAULT_USAGE_LIMIT_PATTERNS` chưa đo trên màn hình limit thật của claude/codex. *Cập nhật 2026-10-05:* câu chữ đo được đầu tiên là của codex, "■ Selected model is at capacity. Please try a different model." (đã thêm vào mẫu mặc định). Ngoài ra, thang liveness chỉ đọc màn hình khi tiến độ dừng, mà `working` tính là tiến độ, nên pane vẫn báo `working` nhưng đang kẹt ở lỗi nhà cung cấp chạy tới trần 15 phút không fallback (thấy khi dogfood mdview). Nay vòng thăm dò đọc 15 dòng cuối của agent đang `working` mỗi 30 giây và kết luận `provider-limit` khi cùng một dòng bắt đầu bằng dấu lỗi của CLI (`■`) và nêu điều kiện (`WORKING_STALL_PATTERNS`, chỉ câu chữ đã đo) còn nằm đó sau một khoảng thăm dò đầy đủ; chữ thường nhắc tới capacity hay rate limit không bị đụng tới.
  - **Trạng thái agent trong herdr (đo 2026-10-05, herdr 0.9.1-vantt.1).** herdr có đúng một nguồn trạng thái cho mỗi pane; fgos từng `pane report-agent --state working` lúc khởi động pane bị cô lập, nên fgos thành nguồn đó và `agent get` đứng yên ở `working` cả vòng (commit `2e9b53f6c` chỉ là đường vòng: đọc `agent explain` trước, hai lần gọi herdr mỗi nhịp thăm dò). Thí nghiệm trong pane thật: claude, codex, agy, pi chạy sau bwrap (không tách pid namespace) đều được herdr nhận ra không cần `HERDR_AGENT`, `agent get` khớp `agent explain`, và `agent prompt --wait` trả `done` sau ~2 giây; sau khi fgos báo `working`, `agent get` kẹt `working` còn `explain` nói `idle`, `agent prompt --wait` quá thời gian; `pane release-agent` trả lại quyền, trạng thái hồi phục sau vài giây. Nay fgos không báo trạng thái; chỉ khi herdr không nhận ra tiến trình là agent (sau 6 giây) mới báo, vì đó là cách duy nhất đánh địa chỉ nó (`ensureHerdrKnowsAgent`). Vòng thăm dò đọc `agent get`, chỉ hỏi `explain` khi `unknown`. Giới hạn: herdr chỉ biết `idle/working/blocked/done/unknown`, không biết lý do; manifest codex khớp ký tự xoay trong tiêu đề terminal là `working` (rule `osc_title_working`), nên pane codex kẹt ở lỗi nhà cung cấp vẫn là `working` và vẫn cần phần đọc màn hình ở trên. Mỗi vòng không bình thường để lại `herdr-diagnosis.json` (lời giải thích của chính herdr).
  - **Agent kẹt ở prompt chỉ người trả lời được (đo 2026-10-05, codex "Trust this folder?").** herdr báo đúng `blocked` (luật `trust_directory`), thang liveness kết luận `blocked` kèm dòng màn hình, nhưng bước settle coi mọi lỗi mang lớp `worker-timeout` là timeout nên run ghi `execution-timeout` và Unit ra `execution-failure`. Nay `blocked` (như `provider-limit`) đi thẳng qua `adapterOutcome`: `failure.code = blocked`, `outcome.category = blocked`, Unit outcome `blocked`, pane giữ nguyên, thông báo nêu cách sửa (trả lời prompt hoặc cấp trust cho project trong home của agent). Không thêm mẫu màn hình vì detector của herdr đã nhận ra màn hình này; màn hình không đọc được vẫn không phải bằng chứng.
  - Inventory account (`runner.providers.<provider>.accounts`) chỉ ở `~/.fgos/config.json` toàn máy; mỗi máy phải tự khai, `fgos setup` không tạo; `fgos doctor` (`confined-pane-accounts`) đọc inventory từ config toàn máy bất kể cwd (không cần project config) và chỉ ra pane thiếu entry; config toàn máy không đọc được thì check FAIL, nêu mã lỗi và đường dẫn.
  - bind chọn invocation herdr **đầu tiên** của executor; executor nhiều account cần luật chọn tường minh về sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0050 — P6 Nối thật: herdr là transport mặc định, posture một đường, fallback quota qua pane mới

- **Trạng thái:** Settled cho ca 1, 2, 3, 4, 6; ca 5 NOT RUN (xem bằng chứng)
- **Bối cảnh:** Sau 0047, `bind().transport`, `resolvePosture` và `nextCandidate` tồn tại nhưng không ai gọi: mọi lần chạy thật là cli headless, posture tự dựng `bwrapArgs` riêng song song với driver confinement, `canApplyPosture` luôn `true`.
- **Quyết định:**
  1. **Transport do `bind()` quyết, `run.mjs` đọc.** herdr khi herdr có mặt trong session **và** executor có invocation `herdr-spawn` có id mà `canApplyPosture` chấp nhận; ngược lại cli (lý do ghi ở `provenance.transport.source`). Transport và invocation thật nằm trong `assignment.json` / `unit.json`, không chỉ ở giá trị trả về. Executor có CLI vẫn out-of-process (D-ADR0033 (một cơ chế dispatch, executor có CLI luôn chạy ngoài process)).
  2. **Posture một đường.** `resolvePosture` chỉ ánh xạ posture -> `requirement` (policy built-in); `requirement` đi vào `buildConfinementRequest` -> Confinement Authority -> driver bwrap, cho cả pane herdr lẫn cli. Không còn `bwrapArgs` tự dựng trong `policies.mjs` (guard test). `resolvePostureInvocation` (`canApplyPosture` là dạng boolean của nó) là nơi duy nhất quyết: invocation khai `confinement.backend`, backend bật trong registry máy, executable chạy được; thiếu thì bind lọc candidate hoặc từ chối `posture-unavailable`, không chạy không confine. Nó cũng trả về invocation đã duyệt: khi `prefer` không nêu invocation, bind ghi đúng invocation cli thường đầu tiên mang được posture (không phải invocation cli đầu tiên của executor; `herdr-spawn` chỉ tính khi session ở trong herdr) vào binding, và `run.mjs` ghim đúng nó. Entry `prefer` nêu invocation thì giữ nguyên. Nên mọi invocation muốn được chọn phải khai `confinement`, và invocation của agent ghi state ngoài thư mục chỉ-đọc (codex, agy, pi) phải khai thêm `resourceBindings` private-home.
  5. **Tra capability.** `bind()` tìm `capabilities[domain:verb]` trước, rồi `capabilities[verb]`, nhưng entry chỉ thắng khi có `prefer` dùng được: slot chỉ có `description` (loại `fgos setup` ghi) không che bare-verb có `prefer`. Không có `prefer` ở đâu cả thì headless bị từ chối `headless-no-executor`; `fgos doctor` (`workflow-capabilities-configured`) cảnh báo đúng capability đó. Mặc định headless chỉ chạy được với Workflow đã khai `prefer`, không phải mọi Workflow `fgos setup` đã ghi slot.
  3. **Fallback quota.** `provider-limit` (herdr đọc màn hình qua detector của herdr, mặc định idle 5 phút nếu config không đặt `idleTimeoutMs`) -> `nextCandidate` đi tiếp `prefer[]` -> pane mới dưới assignment id `<unitRun>/<role>/<round>-fb<n>`; pane cũ giữ nguyên; `fallbackFrom` ghi lại; hết candidate thì outcome vẫn `provider-limit`. cli-spawn không có phát hiện limit nên headless không fallback (*cập nhật 2026-10-14:* nay có, qua câu hạn mức ở đuôi stderr, xem đoạn decision 0058 ở RUL65b). Pane idle (không `working`) quá 15 giây bị đọc màn hình để tìm credential chết (`AUTH_FAILURE_PATTERNS`, vd pi "OAuth refresh failed ... invalid_grant"): thấy thì cũng kết thúc `provider-limit` ngay, không chờ idle timeout, để walk sang candidate kế; classifier ghi quarantine `auth-token` kiểu `manual-clear` (tới khi người login lại và `fgos dispatch reconcile provider-capacity clear-quarantine`), không phải `quota-limit`. Quarantine quota dùng đúng thời gian reset provider ghi trên màn hình ("Resets in 24m1s", cả giờ/phút/giây), mặc định 1 giờ khi không ghi.
  4. **Pane confine cho cả năm họ** (claude, claude qua OpenRouter, codex, agy, pi): mỗi agent giữ state trong private home dựng từ account được lease; công thức và lý do ở [confinement-authority.md §13.1](./confinement-authority.md), account inventory toàn máy ở RUL65b (trên).
  - **Pane không nhận HOME riêng của worker.** Vòng herdr confine mở pane không kèm `HOME` private (launcher script tự `export` nó trước khi `exec`): shell của pane mà bắt đầu trong một home không có file khởi động thì zsh chạy trình hướng dẫn lần đầu và nuốt lệnh khởi chạy gõ ngay sau, nên vòng agy báo `foreground process ... does not match prepared command argv` dù argv không sai.
  - **Prompt delivery trong pane herdr (`inline` mặc định, `file-pointer` tuỳ chọn).** Mặc định `herdr-spawn` gửi toàn bộ nội dung `brief-<round>.md` trực tiếp vào pane qua `herdr agent prompt` (bracketed paste) để người quan sát thấy trọn vẹn prompt trong TUI, đồng thời vẫn ghi `brief-<round>.md` xuống đĩa kèm dòng trỏ đường dẫn phục hồi sau compaction; `promptDelivery: "file-pointer"` (hoặc `FGOS_HERDR_PROMPT_DELIVERY=file-pointer`) giữ cơ chế gõ con trỏ một dòng. `confirmBriefSubmitted` nhận diện cả paste chip thu gọn (`[Pasted text #1 +N lines]`, `[paste #1 +N lines]`, `[Paste]`, `#1 … +N lines`, menu `Pasted N lines`) ở vùng composer cuối màn hình; `SHELL_MANAGED_ENV` giữ nguyên `TERM`/`HERDR_PANE_ID` của pane mới (không để `TERM=dumb` hay `HERDR_PANE_ID` của process gọi ghi đè), `workerBaseEnv` loại bỏ `OMPCODE`/`OMP_PROFILE`/`PI_PROFILE`/`PI_CONFIG_FILES` của phiên cha, và `executors.xai` có thêm invocation `omp-herdr-vantt` chạy `omp` trong pane `bwrap`.
- **Bằng chứng:** [acceptance-herdr.md](../../plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/acceptance-herdr.md): ca 1 (Unit `reviewed`), 2 (reviewer bị chặn ghi repo, ghi được outbox), 3 (Workflow `architecture-advisory` 9 role trong pane, 4 họ provider), 4 (fallback, pane cũ giữ), 6 (headless cli cùng posture) Accepted; transport đọc từ `assignment.json`.
- **Giới hạn đã biết:**
  - Ca 5 (so cùng câu hỏi với engine cũ, tag `pre-engine-retirement`) **NOT RUN**: engine cũ cần Lead tự viết và authorize từng bước, nên "Lead-active" sẽ đo chính thao tác tay, không đo engine.
  - Ca 4 dùng màn hình limit **giả** (executor `fake-limit`); `DEFAULT_USAGE_LIMIT_PATTERNS` chưa đo trên màn hình limit thật của claude/codex. *Cập nhật 2026-10-05:* câu chữ đo được đầu tiên là của codex, "■ Selected model is at capacity. Please try a different model." (đã thêm vào mẫu mặc định). Ngoài ra, thang liveness chỉ đọc màn hình khi tiến độ dừng, mà `working` tính là tiến độ, nên pane vẫn báo `working` nhưng đang kẹt ở lỗi nhà cung cấp chạy tới trần 15 phút không fallback (thấy khi dogfood mdview). Nay vòng thăm dò đọc 15 dòng cuối của agent đang `working` mỗi 30 giây và kết luận `provider-limit` khi cùng một dòng bắt đầu bằng dấu lỗi của CLI (`■`) và nêu điều kiện (`WORKING_STALL_PATTERNS`, chỉ câu chữ đã đo) còn nằm đó sau một khoảng thăm dò đầy đủ; chữ thường nhắc tới capacity hay rate limit không bị đụng tới.
  - **Trạng thái agent trong herdr (đo 2026-10-05, herdr 0.9.1-vantt.1).** herdr có đúng một nguồn trạng thái cho mỗi pane; fgos từng `pane report-agent --state working` lúc khởi động pane bị cô lập, nên fgos thành nguồn đó và `agent get` đứng yên ở `working` cả vòng (commit `2e9b53f6c` chỉ là đường vòng: đọc `agent explain` trước, hai lần gọi herdr mỗi nhịp thăm dò). Thí nghiệm trong pane thật: claude, codex, agy, pi chạy sau bwrap (không tách pid namespace) đều được herdr nhận ra không cần `HERDR_AGENT`, `agent get` khớp `agent explain`, và `agent prompt --wait` trả `done` sau ~2 giây; sau khi fgos báo `working`, `agent get` kẹt `working` còn `explain` nói `idle`, `agent prompt --wait` quá thời gian; `pane release-agent` trả lại quyền, trạng thái hồi phục sau vài giây. Nay fgos không báo trạng thái; chỉ khi herdr không nhận ra tiến trình là agent (sau 6 giây) mới báo, vì đó là cách duy nhất đánh địa chỉ nó (`ensureHerdrKnowsAgent`). Vòng thăm dò đọc `agent get`, chỉ hỏi `explain` khi `unknown`. Giới hạn: herdr chỉ biết `idle/working/blocked/done/unknown`, không biết lý do; manifest codex khớp ký tự xoay trong tiêu đề terminal là `working` (rule `osc_title_working`), nên pane codex kẹt ở lỗi nhà cung cấp vẫn là `working` và vẫn cần phần đọc màn hình ở trên. Mỗi vòng không bình thường để lại `herdr-diagnosis.json` (lời giải thích của chính herdr).
  - **Agent kẹt ở prompt chỉ người trả lời được (đo 2026-10-05, codex "Trust this folder?").** herdr báo đúng `blocked` (luật `trust_directory`), thang liveness kết luận `blocked` kèm dòng màn hình, nhưng bước settle coi mọi lỗi mang lớp `worker-timeout` là timeout nên run ghi `execution-timeout` và Unit ra `execution-failure`. Nay `blocked` (như `provider-limit`) đi thẳng qua `adapterOutcome`: `failure.code = blocked`, `outcome.category = blocked`, Unit outcome `blocked`, pane giữ nguyên, thông báo nêu cách sửa (trả lời prompt hoặc cấp trust cho project trong home của agent). Không thêm mẫu màn hình vì detector của herdr đã nhận ra màn hình này; màn hình không đọc được vẫn không phải bằng chứng.
  - Inventory account (`runner.providers.<provider>.accounts`) chỉ ở `~/.fgos/config.json` toàn máy; mỗi máy phải tự khai, `fgos setup` không tạo; `fgos doctor` (`confined-pane-accounts`) đọc inventory từ config toàn máy bất kể cwd (không cần project config) và chỉ ra pane thiếu entry; config toàn máy không đọc được thì check FAIL, nêu mã lỗi và đường dẫn.
  - bind chọn invocation herdr **đầu tiên** của executor; executor nhiều account cần luật chọn tường minh về sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_dc4ce18e6e9fb14f1c49564fb00173ba

Source digest: 187780a987ac947043008e2cd2c7b5035b28dee6258ee03e9275cb2483f18ce3

Target digest: 187780a987ac947043008e2cd2c7b5035b28dee6258ee03e9275cb2483f18ce3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-317",
  "sourceLines": [
    3138,
    3156
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0050 — P6 Nối thật: herdr là transport mặc định, posture một đường, fallback quota qua pane mới"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-176",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0050 — P6 Nối thật: herdr là transport mặc định, posture một đường, fallback quota qua pane mới"
  ],
  "nativeTargetClaimId": "claim_d8a1e84d34f8970a4193ac023a6fb110",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_dc4ce18e6e9fb14f1c49564fb00173ba",
    "sourceUnitDigest": "187780a987ac947043008e2cd2c7b5035b28dee6258ee03e9275cb2483f18ce3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-176",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-317 (lines 3138–3156) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-176. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "187780a987ac947043008e2cd2c7b5035b28dee6258ee03e9275cb2483f18ce3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0050 — P6 Nối thật: herdr là transport mặc định, posture một đường, fallback quota qua pane mới"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled cho ca 1, 2, 3, 4, 6; ca 5 NOT RUN (xem bằng chứng)
- **Bối cảnh:** Sau 0047, `bind().transport`, `resolvePosture` và `nextCandidate` tồn tại nhưng không ai gọi: mọi lần chạy thật là cli headless, posture tự dựng `bwrapArgs` riêng song song với driver confinement, `canApplyPosture` luôn `true`.
- **Quyết định:**
  1. **Transport do `bind()` quyết, `run.mjs` đọc.** herdr khi herdr có mặt trong session **và** executor có invocation `herdr-spawn` có id mà `canApplyPosture` chấp nhận; ngược lại cli (lý do ghi ở `provenance.transport.source`). Transport và invocation thật nằm trong `assignment.json` / `unit.json`, không chỉ ở giá trị trả về. Executor có CLI vẫn out-of-process (D-ADR0033 (một cơ chế dispatch, executor có CLI luôn chạy ngoài process)).
  2. **Posture một đường.** `resolvePosture` chỉ ánh xạ posture -> `requirement` (policy built-in); `requirement` đi vào `buildConfinementRequest` -> Confinement Authority -> driver bwrap, cho cả pane herdr lẫn cli. Không còn `bwrapArgs` tự dựng trong `policies.mjs` (guard test). `resolvePostureInvocation` (`canApplyPosture` là dạng boolean của nó) là nơi duy nhất quyết: invocation khai `confinement.backend`, backend bật trong registry máy, executable chạy được; thiếu thì bind lọc candidate hoặc từ chối `posture-unavailable`, không chạy không confine. Nó cũng trả về invocation đã duyệt: khi `prefer` không nêu invocation, bind ghi đúng invocation cli thường đầu tiên mang được posture (không phải invocation cli đầu tiên của executor; `herdr-spawn` chỉ tính khi session ở trong herdr) vào binding, và `run.mjs` ghim đúng nó. Entry `prefer` nêu invocation thì giữ nguyên. Nên mọi invocation muốn được chọn phải khai `confinement`, và invocation của agent ghi state ngoài thư mục chỉ-đọc (codex, agy, pi) phải khai thêm `resourceBindings` private-home.
  5. **Tra capability.** `bind()` tìm `capabilities[domain:verb]` trước, rồi `capabilities[verb]`, nhưng entry chỉ thắng khi có `prefer` dùng được: slot chỉ có `description` (loại `fgos setup` ghi) không che bare-verb có `prefer`. Không có `prefer` ở đâu cả thì headless bị từ chối `headless-no-executor`; `fgos doctor` (`workflow-capabilities-configured`) cảnh báo đúng capability đó. Mặc định headless chỉ chạy được với Workflow đã khai `prefer`, không phải mọi Workflow `fgos setup` đã ghi slot.
  3. **Fallback quota.** `provider-limit` (herdr đọc màn hình qua detector của herdr, mặc định idle 5 phút nếu config không đặt `idleTimeoutMs`) -> `nextCandidate` đi tiếp `prefer[]` -> pane mới dưới assignment id `<unitRun>/<role>/<round>-fb<n>`; pane cũ giữ nguyên; `fallbackFrom` ghi lại; hết candidate thì outcome vẫn `provider-limit`. cli-spawn không có phát hiện limit nên headless không fallback (*cập nhật 2026-10-14:* nay có, qua câu hạn mức ở đuôi stderr, xem đoạn decision 0058 ở RUL65b). Pane idle (không `working`) quá 15 giây bị đọc màn hình để tìm credential chết (`AUTH_FAILURE_PATTERNS`, vd pi "OAuth refresh failed ... invalid_grant"): thấy thì cũng kết thúc `provider-limit` ngay, không chờ idle timeout, để walk sang candidate kế; classifier ghi quarantine `auth-token` kiểu `manual-clear` (tới khi người login lại và `fgos dispatch reconcile provider-capacity clear-quarantine`), không phải `quota-limit`. Quarantine quota dùng đúng thời gian reset provider ghi trên màn hình ("Resets in 24m1s", cả giờ/phút/giây), mặc định 1 giờ khi không ghi.
  4. **Pane confine cho cả năm họ** (claude, claude qua OpenRouter, codex, agy, pi): mỗi agent giữ state trong private home dựng từ account được lease; công thức và lý do ở [confinement-authority.md §13.1](./confinement-authority.md), account inventory toàn máy ở RUL65b (trên).
  - **Pane không nhận HOME riêng của worker.** Vòng herdr confine mở pane không kèm `HOME` private (launcher script tự `export` nó trước khi `exec`): shell của pane mà bắt đầu trong một home không có file khởi động thì zsh chạy trình hướng dẫn lần đầu và nuốt lệnh khởi chạy gõ ngay sau, nên vòng agy báo `foreground process ... does not match prepared command argv` dù argv không sai.
  - **Prompt delivery trong pane herdr (`inline` mặc định, `file-pointer` tuỳ chọn).** Mặc định `herdr-spawn` gửi toàn bộ nội dung `brief-<round>.md` trực tiếp vào pane qua `herdr agent prompt` (bracketed paste) để người quan sát thấy trọn vẹn prompt trong TUI, đồng thời vẫn ghi `brief-<round>.md` xuống đĩa kèm dòng trỏ đường dẫn phục hồi sau compaction; `promptDelivery: "file-pointer"` (hoặc `FGOS_HERDR_PROMPT_DELIVERY=file-pointer`) giữ cơ chế gõ con trỏ một dòng. `confirmBriefSubmitted` nhận diện cả paste chip thu gọn (`[Pasted text #1 +N lines]`, `[paste #1 +N lines]`, `[Paste]`, `#1 … +N lines`, menu `Pasted N lines`) ở vùng composer cuối màn hình; `SHELL_MANAGED_ENV` giữ nguyên `TERM`/`HERDR_PANE_ID` của pane mới (không để `TERM=dumb` hay `HERDR_PANE_ID` của process gọi ghi đè), `workerBaseEnv` loại bỏ `OMPCODE`/`OMP_PROFILE`/`PI_PROFILE`/`PI_CONFIG_FILES` của phiên cha, và `executors.xai` có thêm invocation `omp-herdr-vantt` chạy `omp` trong pane `bwrap`.
- **Bằng chứng:** [acceptance-herdr.md](../../plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/acceptance-herdr.md): ca 1 (Unit `reviewed`), 2 (reviewer bị chặn ghi repo, ghi được outbox), 3 (Workflow `architecture-advisory` 9 role trong pane, 4 họ provider), 4 (fallback, pane cũ giữ), 6 (headless cli cùng posture) Accepted; transport đọc từ `assignment.json`.
- **Giới hạn đã biết:**
  - Ca 5 (so cùng câu hỏi với engine cũ, tag `pre-engine-retirement`) **NOT RUN**: engine cũ cần Lead tự viết và authorize từng bước, nên "Lead-active" sẽ đo chính thao tác tay, không đo engine.
  - Ca 4 dùng màn hình limit **giả** (executor `fake-limit`); `DEFAULT_USAGE_LIMIT_PATTERNS` chưa đo trên màn hình limit thật của claude/codex. *Cập nhật 2026-10-05:* câu chữ đo được đầu tiên là của codex, "■ Selected model is at capacity. Please try a different model." (đã thêm vào mẫu mặc định). Ngoài ra, thang liveness chỉ đọc màn hình khi tiến độ dừng, mà `working` tính là tiến độ, nên pane vẫn báo `working` nhưng đang kẹt ở lỗi nhà cung cấp chạy tới trần 15 phút không fallback (thấy khi dogfood mdview). Nay vòng thăm dò đọc 15 dòng cuối của agent đang `working` mỗi 30 giây và kết luận `provider-limit` khi cùng một dòng bắt đầu bằng dấu lỗi của CLI (`■`) và nêu điều kiện (`WORKING_STALL_PATTERNS`, chỉ câu chữ đã đo) còn nằm đó sau một khoảng thăm dò đầy đủ; chữ thường nhắc tới capacity hay rate limit không bị đụng tới.
  - **Trạng thái agent trong herdr (đo 2026-10-05, herdr 0.9.1-vantt.1).** herdr có đúng một nguồn trạng thái cho mỗi pane; fgos từng `pane report-agent --state working` lúc khởi động pane bị cô lập, nên fgos thành nguồn đó và `agent get` đứng yên ở `working` cả vòng (commit `2e9b53f6c` chỉ là đường vòng: đọc `agent explain` trước, hai lần gọi herdr mỗi nhịp thăm dò). Thí nghiệm trong pane thật: claude, codex, agy, pi chạy sau bwrap (không tách pid namespace) đều được herdr nhận ra không cần `HERDR_AGENT`, `agent get` khớp `agent explain`, và `agent prompt --wait` trả `done` sau ~2 giây; sau khi fgos báo `working`, `agent get` kẹt `working` còn `explain` nói `idle`, `agent prompt --wait` quá thời gian; `pane release-agent` trả lại quyền, trạng thái hồi phục sau vài giây. Nay fgos không báo trạng thái; chỉ khi herdr không nhận ra tiến trình là agent (sau 6 giây) mới báo, vì đó là cách duy nhất đánh địa chỉ nó (`ensureHerdrKnowsAgent`). Vòng thăm dò đọc `agent get`, chỉ hỏi `explain` khi `unknown`. Giới hạn: herdr chỉ biết `idle/working/blocked/done/unknown`, không biết lý do; manifest codex khớp ký tự xoay trong tiêu đề terminal là `working` (rule `osc_title_working`), nên pane codex kẹt ở lỗi nhà cung cấp vẫn là `working` và vẫn cần phần đọc màn hình ở trên. Mỗi vòng không bình thường để lại `herdr-diagnosis.json` (lời giải thích của chính herdr).
  - **Agent kẹt ở prompt chỉ người trả lời được (đo 2026-10-05, codex "Trust this folder?").** herdr báo đúng `blocked` (luật `trust_directory`), thang liveness kết luận `blocked` kèm dòng màn hình, nhưng bước settle coi mọi lỗi mang lớp `worker-timeout` là timeout nên run ghi `execution-timeout` và Unit ra `execution-failure`. Nay `blocked` (như `provider-limit`) đi thẳng qua `adapterOutcome`: `failure.code = blocked`, `outcome.category = blocked`, Unit outcome `blocked`, pane giữ nguyên, thông báo nêu cách sửa (trả lời prompt hoặc cấp trust cho project trong home của agent). Không thêm mẫu màn hình vì detector của herdr đã nhận ra màn hình này; màn hình không đọc được vẫn không phải bằng chứng.
  - Inventory account (`runner.providers.<provider>.accounts`) chỉ ở `~/.fgos/config.json` toàn máy; mỗi máy phải tự khai, `fgos setup` không tạo; `fgos doctor` (`confined-pane-accounts`) đọc inventory từ config toàn máy bất kể cwd (không cần project config) và chỉ ra pane thiếu entry; config toàn máy không đọc được thì check FAIL, nêu mã lỗi và đường dẫn.
  - bind chọn invocation herdr **đầu tiên** của executor; executor nhiều account cần luật chọn tường minh về sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled cho ca 1, 2, 3, 4, 6; ca 5 NOT RUN (xem bằng chứng)
- **Bối cảnh:** Sau 0047, `bind().transport`, `resolvePosture` và `nextCandidate` tồn tại nhưng không ai gọi: mọi lần chạy thật là cli headless, posture tự dựng `bwrapArgs` riêng song song với driver confinement, `canApplyPosture` luôn `true`.
- **Quyết định:**
  1. **Transport do `bind()` quyết, `run.mjs` đọc.** herdr khi herdr có mặt trong session **và** executor có invocation `herdr-spawn` có id mà `canApplyPosture` chấp nhận; ngược lại cli (lý do ghi ở `provenance.transport.source`). Transport và invocation thật nằm trong `assignment.json` / `unit.json`, không chỉ ở giá trị trả về. Executor có CLI vẫn out-of-process (D-ADR0033 (một cơ chế dispatch, executor có CLI luôn chạy ngoài process)).
  2. **Posture một đường.** `resolvePosture` chỉ ánh xạ posture -> `requirement` (policy built-in); `requirement` đi vào `buildConfinementRequest` -> Confinement Authority -> driver bwrap, cho cả pane herdr lẫn cli. Không còn `bwrapArgs` tự dựng trong `policies.mjs` (guard test). `resolvePostureInvocation` (`canApplyPosture` là dạng boolean của nó) là nơi duy nhất quyết: invocation khai `confinement.backend`, backend bật trong registry máy, executable chạy được; thiếu thì bind lọc candidate hoặc từ chối `posture-unavailable`, không chạy không confine. Nó cũng trả về invocation đã duyệt: khi `prefer` không nêu invocation, bind ghi đúng invocation cli thường đầu tiên mang được posture (không phải invocation cli đầu tiên của executor; `herdr-spawn` chỉ tính khi session ở trong herdr) vào binding, và `run.mjs` ghim đúng nó. Entry `prefer` nêu invocation thì giữ nguyên. Nên mọi invocation muốn được chọn phải khai `confinement`, và invocation của agent ghi state ngoài thư mục chỉ-đọc (codex, agy, pi) phải khai thêm `resourceBindings` private-home.
  5. **Tra capability.** `bind()` tìm `capabilities[domain:verb]` trước, rồi `capabilities[verb]`, nhưng entry chỉ thắng khi có `prefer` dùng được: slot chỉ có `description` (loại `fgos setup` ghi) không che bare-verb có `prefer`. Không có `prefer` ở đâu cả thì headless bị từ chối `headless-no-executor`; `fgos doctor` (`workflow-capabilities-configured`) cảnh báo đúng capability đó. Mặc định headless chỉ chạy được với Workflow đã khai `prefer`, không phải mọi Workflow `fgos setup` đã ghi slot.
  3. **Fallback quota.** `provider-limit` (herdr đọc màn hình qua detector của herdr, mặc định idle 5 phút nếu config không đặt `idleTimeoutMs`) -> `nextCandidate` đi tiếp `prefer[]` -> pane mới dưới assignment id `<unitRun>/<role>/<round>-fb<n>`; pane cũ giữ nguyên; `fallbackFrom` ghi lại; hết candidate thì outcome vẫn `provider-limit`. cli-spawn không có phát hiện limit nên headless không fallback (*cập nhật 2026-10-14:* nay có, qua câu hạn mức ở đuôi stderr, xem đoạn decision 0058 ở RUL65b). Pane idle (không `working`) quá 15 giây bị đọc màn hình để tìm credential chết (`AUTH_FAILURE_PATTERNS`, vd pi "OAuth refresh failed ... invalid_grant"): thấy thì cũng kết thúc `provider-limit` ngay, không chờ idle timeout, để walk sang candidate kế; classifier ghi quarantine `auth-token` kiểu `manual-clear` (tới khi người login lại và `fgos dispatch reconcile provider-capacity clear-quarantine`), không phải `quota-limit`. Quarantine quota dùng đúng thời gian reset provider ghi trên màn hình ("Resets in 24m1s", cả giờ/phút/giây), mặc định 1 giờ khi không ghi.
  4. **Pane confine cho cả năm họ** (claude, claude qua OpenRouter, codex, agy, pi): mỗi agent giữ state trong private home dựng từ account được lease; công thức và lý do ở [confinement-authority.md §13.1](./confinement-authority.md), account inventory toàn máy ở RUL65b (trên).
  - **Pane không nhận HOME riêng của worker.** Vòng herdr confine mở pane không kèm `HOME` private (launcher script tự `export` nó trước khi `exec`): shell của pane mà bắt đầu trong một home không có file khởi động thì zsh chạy trình hướng dẫn lần đầu và nuốt lệnh khởi chạy gõ ngay sau, nên vòng agy báo `foreground process ... does not match prepared command argv` dù argv không sai.
  - **Prompt delivery trong pane herdr (`inline` mặc định, `file-pointer` tuỳ chọn).** Mặc định `herdr-spawn` gửi toàn bộ nội dung `brief-<round>.md` trực tiếp vào pane qua `herdr agent prompt` (bracketed paste) để người quan sát thấy trọn vẹn prompt trong TUI, đồng thời vẫn ghi `brief-<round>.md` xuống đĩa kèm dòng trỏ đường dẫn phục hồi sau compaction; `promptDelivery: "file-pointer"` (hoặc `FGOS_HERDR_PROMPT_DELIVERY=file-pointer`) giữ cơ chế gõ con trỏ một dòng. `confirmBriefSubmitted` nhận diện cả paste chip thu gọn (`[Pasted text #1 +N lines]`, `[paste #1 +N lines]`, `[Paste]`, `#1 … +N lines`, menu `Pasted N lines`) ở vùng composer cuối màn hình; `SHELL_MANAGED_ENV` giữ nguyên `TERM`/`HERDR_PANE_ID` của pane mới (không để `TERM=dumb` hay `HERDR_PANE_ID` của process gọi ghi đè), `workerBaseEnv` loại bỏ `OMPCODE`/`OMP_PROFILE`/`PI_PROFILE`/`PI_CONFIG_FILES` của phiên cha, và `executors.xai` có thêm invocation `omp-herdr-vantt` chạy `omp` trong pane `bwrap`.
- **Bằng chứng:** [acceptance-herdr.md](../../plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/acceptance-herdr.md): ca 1 (Unit `reviewed`), 2 (reviewer bị chặn ghi repo, ghi được outbox), 3 (Workflow `architecture-advisory` 9 role trong pane, 4 họ provider), 4 (fallback, pane cũ giữ), 6 (headless cli cùng posture) Accepted; transport đọc từ `assignment.json`.
- **Giới hạn đã biết:**
  - Ca 5 (so cùng câu hỏi với engine cũ, tag `pre-engine-retirement`) **NOT RUN**: engine cũ cần Lead tự viết và authorize từng bước, nên "Lead-active" sẽ đo chính thao tác tay, không đo engine.
  - Ca 4 dùng màn hình limit **giả** (executor `fake-limit`); `DEFAULT_USAGE_LIMIT_PATTERNS` chưa đo trên màn hình limit thật của claude/codex. *Cập nhật 2026-10-05:* câu chữ đo được đầu tiên là của codex, "■ Selected model is at capacity. Please try a different model." (đã thêm vào mẫu mặc định). Ngoài ra, thang liveness chỉ đọc màn hình khi tiến độ dừng, mà `working` tính là tiến độ, nên pane vẫn báo `working` nhưng đang kẹt ở lỗi nhà cung cấp chạy tới trần 15 phút không fallback (thấy khi dogfood mdview). Nay vòng thăm dò đọc 15 dòng cuối của agent đang `working` mỗi 30 giây và kết luận `provider-limit` khi cùng một dòng bắt đầu bằng dấu lỗi của CLI (`■`) và nêu điều kiện (`WORKING_STALL_PATTERNS`, chỉ câu chữ đã đo) còn nằm đó sau một khoảng thăm dò đầy đủ; chữ thường nhắc tới capacity hay rate limit không bị đụng tới.
  - **Trạng thái agent trong herdr (đo 2026-10-05, herdr 0.9.1-vantt.1).** herdr có đúng một nguồn trạng thái cho mỗi pane; fgos từng `pane report-agent --state working` lúc khởi động pane bị cô lập, nên fgos thành nguồn đó và `agent get` đứng yên ở `working` cả vòng (commit `2e9b53f6c` chỉ là đường vòng: đọc `agent explain` trước, hai lần gọi herdr mỗi nhịp thăm dò). Thí nghiệm trong pane thật: claude, codex, agy, pi chạy sau bwrap (không tách pid namespace) đều được herdr nhận ra không cần `HERDR_AGENT`, `agent get` khớp `agent explain`, và `agent prompt --wait` trả `done` sau ~2 giây; sau khi fgos báo `working`, `agent get` kẹt `working` còn `explain` nói `idle`, `agent prompt --wait` quá thời gian; `pane release-agent` trả lại quyền, trạng thái hồi phục sau vài giây. Nay fgos không báo trạng thái; chỉ khi herdr không nhận ra tiến trình là agent (sau 6 giây) mới báo, vì đó là cách duy nhất đánh địa chỉ nó (`ensureHerdrKnowsAgent`). Vòng thăm dò đọc `agent get`, chỉ hỏi `explain` khi `unknown`. Giới hạn: herdr chỉ biết `idle/working/blocked/done/unknown`, không biết lý do; manifest codex khớp ký tự xoay trong tiêu đề terminal là `working` (rule `osc_title_working`), nên pane codex kẹt ở lỗi nhà cung cấp vẫn là `working` và vẫn cần phần đọc màn hình ở trên. Mỗi vòng không bình thường để lại `herdr-diagnosis.json` (lời giải thích của chính herdr).
  - **Agent kẹt ở prompt chỉ người trả lời được (đo 2026-10-05, codex "Trust this folder?").** herdr báo đúng `blocked` (luật `trust_directory`), thang liveness kết luận `blocked` kèm dòng màn hình, nhưng bước settle coi mọi lỗi mang lớp `worker-timeout` là timeout nên run ghi `execution-timeout` và Unit ra `execution-failure`. Nay `blocked` (như `provider-limit`) đi thẳng qua `adapterOutcome`: `failure.code = blocked`, `outcome.category = blocked`, Unit outcome `blocked`, pane giữ nguyên, thông báo nêu cách sửa (trả lời prompt hoặc cấp trust cho project trong home của agent). Không thêm mẫu màn hình vì detector của herdr đã nhận ra màn hình này; màn hình không đọc được vẫn không phải bằng chứng.
  - Inventory account (`runner.providers.<provider>.accounts`) chỉ ở `~/.fgos/config.json` toàn máy; mỗi máy phải tự khai, `fgos setup` không tạo; `fgos doctor` (`confined-pane-accounts`) đọc inventory từ config toàn máy bất kể cwd (không cần project config) và chỉ ra pane thiếu entry; config toàn máy không đọc được thì check FAIL, nêu mã lỗi và đường dẫn.
  - bind chọn invocation herdr **đầu tiên** của executor; executor nhiều account cần luật chọn tường minh về sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_c7b6b863e630f2b685c29f09b5db02c4

Source digest: 181cde40f90478c0541bbf0892a5eceae965f9c1e5d7f5e366e5a777b7241311

Target digest: 181cde40f90478c0541bbf0892a5eceae965f9c1e5d7f5e366e5a777b7241311

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop",
  "sourceLines": [
    3158,
    3158
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_5220ed156889af3e65c59c90648b172e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c7b6b863e630f2b685c29f09b5db02c4",
    "sourceUnitDigest": "181cde40f90478c0541bbf0892a5eceae965f9c1e5d7f5e366e5a777b7241311",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop (lines 3158–3158) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "181cde40f90478c0541bbf0892a5eceae965f9c1e5d7f5e366e5a777b7241311",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0051 — Cổng ghi file đi theo chuỗi fallback; quyền git của invocation giữ lại cho Work loop

- **Trạng thái:** Settled (2026-10-03)
- **Bối cảnh:** 0050 cho `provider-limit` đi tiếp `prefer[]`, nhưng cổng ghi file của 0047 §5 tính lại `bind()` từ đầu pool nên một producer ghi file fallback sang candidate kế bị từ chối `binding mismatch`; chỉ vai read-only (không qua cổng) fallback được. Ngoài ra `allowedTools` của invocation claude/glm không confine vẫn cấp `Bash(git add:*)`/`Bash(git commit:*)` dù runner đã tự commit cho producer (`commit-unit-work.mjs`).
- **Quyết định:**
  1. **Cổng đi tiếp sau candidate đã chạm limit.** Với assignment `<unitRun>/<role>/<round>-fb<n>`, cổng tính lại `bind()` bỏ qua đến `candidateIndex` của attempt liền trước trong `unit.json`, **chỉ khi** attempt đó có outcome `provider-limit` (`fallbackSkipIndex`, `assignment-runner.mjs`). Giá trị đọc từ chuỗi attempt runner đã persist trước khi dispatch, không từ assignment; assignment không có trong chuỗi `<role>/<round>` của chính nó (id mượn từ vai hoặc vòng khác không tính), hoặc attempt trước không phải `provider-limit`, thì bind từ đầu pool như cũ → binding giả mạo vẫn bị từ chối. Mỗi attempt trong `unit.json` ghi thêm `skipCandidateIndex` và `candidateIndex`.
  2. **Quyền git của invocation KHÔNG bỏ.** Các invocation `claude-cli`, `glm` và `runner.executor` mặc định (không confine) cũng là đường chạy của worker coding trong Work loop (`loop.mjs`), nơi worker tự commit trên nhánh item theo hợp đồng worker (Layer 2 rule 3) và loop không có bước commit của runner; bỏ grant sẽ làm worker không commit được (đã từng đo: tsk-1jt, tsk-1dsr). Invocation bwrap không cần grant vì git metadata đọc-only trong sandbox. Ngoại lệ có chủ này kết thúc khi Work loop chuyển sang runner commit.
- **Giới hạn đã biết:** grant còn lại làm `provider-adapter` không đánh dấu invocation không confine là `applied-via-tool-gating`; producer không confine vẫn có thể tự `git add`/`git commit` (runner commit sau đó ghi `no-changes`, không lỗi).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0051 — Cổng ghi file đi theo chuỗi fallback; quyền git của invocation giữ lại cho Work loop

- **Trạng thái:** Settled (2026-10-03)
- **Bối cảnh:** 0050 cho `provider-limit` đi tiếp `prefer[]`, nhưng cổng ghi file của 0047 §5 tính lại `bind()` từ đầu pool nên một producer ghi file fallback sang candidate kế bị từ chối `binding mismatch`; chỉ vai read-only (không qua cổng) fallback được. Ngoài ra `allowedTools` của invocation claude/glm không confine vẫn cấp `Bash(git add:*)`/`Bash(git commit:*)` dù runner đã tự commit cho producer (`commit-unit-work.mjs`).
- **Quyết định:**
  1. **Cổng đi tiếp sau candidate đã chạm limit.** Với assignment `<unitRun>/<role>/<round>-fb<n>`, cổng tính lại `bind()` bỏ qua đến `candidateIndex` của attempt liền trước trong `unit.json`, **chỉ khi** attempt đó có outcome `provider-limit` (`fallbackSkipIndex`, `assignment-runner.mjs`). Giá trị đọc từ chuỗi attempt runner đã persist trước khi dispatch, không từ assignment; assignment không có trong chuỗi `<role>/<round>` của chính nó (id mượn từ vai hoặc vòng khác không tính), hoặc attempt trước không phải `provider-limit`, thì bind từ đầu pool như cũ → binding giả mạo vẫn bị từ chối. Mỗi attempt trong `unit.json` ghi thêm `skipCandidateIndex` và `candidateIndex`.
  2. **Quyền git của invocation KHÔNG bỏ.** Các invocation `claude-cli`, `glm` và `runner.executor` mặc định (không confine) cũng là đường chạy của worker coding trong Work loop (`loop.mjs`), nơi worker tự commit trên nhánh item theo hợp đồng worker (Layer 2 rule 3) và loop không có bước commit của runner; bỏ grant sẽ làm worker không commit được (đã từng đo: tsk-1jt, tsk-1dsr). Invocation bwrap không cần grant vì git metadata đọc-only trong sandbox. Ngoại lệ có chủ này kết thúc khi Work loop chuyển sang runner commit.
- **Giới hạn đã biết:** grant còn lại làm `provider-adapter` không đánh dấu invocation không confine là `applied-via-tool-gating`; producer không confine vẫn có thể tự `git add`/`git commit` (runner commit sau đó ghi `no-changes`, không lỗi).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_0ff1945d9de2483e7c615450e71b8bcf

Source digest: eb2ceb790602f8bd3310614dd469d2ca6038960a4985a5634d5a22a1030c7fe0

Target digest: eb2ceb790602f8bd3310614dd469d2ca6038960a4985a5634d5a22a1030c7fe0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-318",
  "sourceLines": [
    3160,
    3166
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0051 — Cổng ghi file đi theo chuỗi fallback; quyền git của invocation giữ lại cho Work loop"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-177",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0051 — Cổng ghi file đi theo chuỗi fallback; quyền git của invocation giữ lại cho Work loop"
  ],
  "nativeTargetClaimId": "claim_8e54f51a7549b373e6cfeab23daf1063",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0ff1945d9de2483e7c615450e71b8bcf",
    "sourceUnitDigest": "eb2ceb790602f8bd3310614dd469d2ca6038960a4985a5634d5a22a1030c7fe0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-177",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-318 (lines 3160–3166) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-177. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "eb2ceb790602f8bd3310614dd469d2ca6038960a4985a5634d5a22a1030c7fe0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0051 — Cổng ghi file đi theo chuỗi fallback; quyền git của invocation giữ lại cho Work loop"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-03)
- **Bối cảnh:** 0050 cho `provider-limit` đi tiếp `prefer[]`, nhưng cổng ghi file của 0047 §5 tính lại `bind()` từ đầu pool nên một producer ghi file fallback sang candidate kế bị từ chối `binding mismatch`; chỉ vai read-only (không qua cổng) fallback được. Ngoài ra `allowedTools` của invocation claude/glm không confine vẫn cấp `Bash(git add:*)`/`Bash(git commit:*)` dù runner đã tự commit cho producer (`commit-unit-work.mjs`).
- **Quyết định:**
  1. **Cổng đi tiếp sau candidate đã chạm limit.** Với assignment `<unitRun>/<role>/<round>-fb<n>`, cổng tính lại `bind()` bỏ qua đến `candidateIndex` của attempt liền trước trong `unit.json`, **chỉ khi** attempt đó có outcome `provider-limit` (`fallbackSkipIndex`, `assignment-runner.mjs`). Giá trị đọc từ chuỗi attempt runner đã persist trước khi dispatch, không từ assignment; assignment không có trong chuỗi `<role>/<round>` của chính nó (id mượn từ vai hoặc vòng khác không tính), hoặc attempt trước không phải `provider-limit`, thì bind từ đầu pool như cũ → binding giả mạo vẫn bị từ chối. Mỗi attempt trong `unit.json` ghi thêm `skipCandidateIndex` và `candidateIndex`.
  2. **Quyền git của invocation KHÔNG bỏ.** Các invocation `claude-cli`, `glm` và `runner.executor` mặc định (không confine) cũng là đường chạy của worker coding trong Work loop (`loop.mjs`), nơi worker tự commit trên nhánh item theo hợp đồng worker (Layer 2 rule 3) và loop không có bước commit của runner; bỏ grant sẽ làm worker không commit được (đã từng đo: tsk-1jt, tsk-1dsr). Invocation bwrap không cần grant vì git metadata đọc-only trong sandbox. Ngoại lệ có chủ này kết thúc khi Work loop chuyển sang runner commit.
- **Giới hạn đã biết:** grant còn lại làm `provider-adapter` không đánh dấu invocation không confine là `applied-via-tool-gating`; producer không confine vẫn có thể tự `git add`/`git commit` (runner commit sau đó ghi `no-changes`, không lỗi).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-03)
- **Bối cảnh:** 0050 cho `provider-limit` đi tiếp `prefer[]`, nhưng cổng ghi file của 0047 §5 tính lại `bind()` từ đầu pool nên một producer ghi file fallback sang candidate kế bị từ chối `binding mismatch`; chỉ vai read-only (không qua cổng) fallback được. Ngoài ra `allowedTools` của invocation claude/glm không confine vẫn cấp `Bash(git add:*)`/`Bash(git commit:*)` dù runner đã tự commit cho producer (`commit-unit-work.mjs`).
- **Quyết định:**
  1. **Cổng đi tiếp sau candidate đã chạm limit.** Với assignment `<unitRun>/<role>/<round>-fb<n>`, cổng tính lại `bind()` bỏ qua đến `candidateIndex` của attempt liền trước trong `unit.json`, **chỉ khi** attempt đó có outcome `provider-limit` (`fallbackSkipIndex`, `assignment-runner.mjs`). Giá trị đọc từ chuỗi attempt runner đã persist trước khi dispatch, không từ assignment; assignment không có trong chuỗi `<role>/<round>` của chính nó (id mượn từ vai hoặc vòng khác không tính), hoặc attempt trước không phải `provider-limit`, thì bind từ đầu pool như cũ → binding giả mạo vẫn bị từ chối. Mỗi attempt trong `unit.json` ghi thêm `skipCandidateIndex` và `candidateIndex`.
  2. **Quyền git của invocation KHÔNG bỏ.** Các invocation `claude-cli`, `glm` và `runner.executor` mặc định (không confine) cũng là đường chạy của worker coding trong Work loop (`loop.mjs`), nơi worker tự commit trên nhánh item theo hợp đồng worker (Layer 2 rule 3) và loop không có bước commit của runner; bỏ grant sẽ làm worker không commit được (đã từng đo: tsk-1jt, tsk-1dsr). Invocation bwrap không cần grant vì git metadata đọc-only trong sandbox. Ngoại lệ có chủ này kết thúc khi Work loop chuyển sang runner commit.
- **Giới hạn đã biết:** grant còn lại làm `provider-adapter` không đánh dấu invocation không confine là `applied-via-tool-gating`; producer không confine vẫn có thể tự `git add`/`git commit` (runner commit sau đó ghi `no-changes`, không lỗi).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_a3e251ef31f006e7fd01ebc9640b94ca

Source digest: 04f68eee53c6601115869e0dec85769498db8f63b00fd7cf5ba4cfb859a35c8f

Target digest: 04f68eee53c6601115869e0dec85769498db8f63b00fd7cf5ba4cfb859a35c8f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
  "sourceLines": [
    3168,
    3168
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_16be53e810d669887e423d507afac394",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [
    {
      "oldSource": "docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051",
      "oldTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051",
      "currentSource": "docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "currentTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "originalRow": "| `docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051` | `docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051` | decision | split | Direct units of this heading only; nested headings have their own explicit row. Original headings retained; any new subdivision is Added in candidate. Source blob: `473a009662f22fb5d745e6ae151136da324d0d5e`. |",
      "rule": "P2 Lead decision: rebind stale source and target anchors; old row recorded as rebinding receipt, ownership now in additive current-heading row."
    }
  ],
  "decision": {
    "claimId": "claim_a3e251ef31f006e7fd01ebc9640b94ca",
    "sourceUnitDigest": "04f68eee53c6601115869e0dec85769498db8f63b00fd7cf5ba4cfb859a35c8f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060 (lines 3168–3168) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "04f68eee53c6601115869e0dec85769498db8f63b00fd7cf5ba4cfb859a35c8f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0052 — Worker không bao giờ có quyền git: runner commit trên mọi đường (thay mục 2 của 0051) [ĐÃ BỊ THAY MỘT PHẦN bởi 0060]

- **Trạng thái:** Settled (2026-10-04). Thay thế mục 2 của 0051 ("quyền git của invocation KHÔNG bỏ"); mục 1 của 0051 giữ nguyên.
- **Bối cảnh:** 0051 giữ grant `git add`/`git commit` trên invocation không confine (`claude-cli`, `glm`, `runner.executor` mặc định) vì Work loop (`loop.mjs`) chưa có bước commit của runner — worker tự commit theo hợp đồng worker. Ngoại lệ có chủ đó kết thúc khi Work loop chuyển sang runner commit.
- **Quyết định:**
  1. **Runner commit trước goal-check.** Trong `loop.mjs`, sau khi worker trả về và trước `runGoalCheck`, runner gọi `commitUnitWork` (cùng hàm đường `fgos run` dùng: `git add -A` trừ `.fgos/`, identity của repo, rồi commit) trên worktree của item. Cây sạch → không commit (worker cũ vẫn tự commit, hoặc worker không đổi gì → goal-check xử lý như "nhánh không có commit", `verify-miss`). Commit lỗi → `worktree-fail` (hạ tầng, đi theo ma trận hồi phục), không nuốt. Quét nghiên-cứu (discovery) và `fanout-batch` (pick -> execute -> return) commit theo cùng luật; driver tương tác commit phần worker để lại ở bước Commit của skill `fgos-coding-implement`.
  2. **Subject commit** là `summary` trong khối JSON Result của worker nếu có, ngược lại `<id>: <title>`. Bản ghi output cục bộ ghi `commit runner | self | none`.
  3. **Bỏ mọi grant git.** Mặc định `runner.executor` và `.fgos/config.json` (`claude-cli`, `glm`) không còn `--allowedTools` chứa `git add`/`git commit`; hợp đồng worker (Layer 2 rule 3) và prompt template bảo worker sửa file rồi dừng, không commit. Self-check Iron Law trong template đọc file đổi từ cây làm việc (runner commit sau).
  4. **Doctor** (`invocation-git-write-grants`) cảnh báo invocation/executor nào còn cấp `Bash(git add|commit)`; không tự xoá config của người dùng.
- **Hướng sau (không làm ở đây):** cho Work loop chạy hẳn qua Workflow runner (khớp hướng P3) — lớn hơn nhiều, và `loop.mjs` bị đánh CRITICAL; chỉ thay điểm commit, giữ nguyên vòng lặp.
- **Giới hạn đã biết:** `verifiedSha` do worker báo là tip của worker; sau runner commit tip đã đi qua nên `fgos return` chạy lại verify thay vì tin sha (an toàn, tốn thêm một lượt verify). Worker ở project khác dùng bản fgOS cũ vẫn tự commit được nếu config của họ còn grant — doctor chỉ ra.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0052 — Worker không bao giờ có quyền git: runner commit trên mọi đường (thay mục 2 của 0051) [ĐÃ BỊ THAY MỘT PHẦN bởi 0060]

- **Trạng thái:** Settled (2026-10-04). Thay thế mục 2 của 0051 ("quyền git của invocation KHÔNG bỏ"); mục 1 của 0051 giữ nguyên.
- **Bối cảnh:** 0051 giữ grant `git add`/`git commit` trên invocation không confine (`claude-cli`, `glm`, `runner.executor` mặc định) vì Work loop (`loop.mjs`) chưa có bước commit của runner — worker tự commit theo hợp đồng worker. Ngoại lệ có chủ đó kết thúc khi Work loop chuyển sang runner commit.
- **Quyết định:**
  1. **Runner commit trước goal-check.** Trong `loop.mjs`, sau khi worker trả về và trước `runGoalCheck`, runner gọi `commitUnitWork` (cùng hàm đường `fgos run` dùng: `git add -A` trừ `.fgos/`, identity của repo, rồi commit) trên worktree của item. Cây sạch → không commit (worker cũ vẫn tự commit, hoặc worker không đổi gì → goal-check xử lý như "nhánh không có commit", `verify-miss`). Commit lỗi → `worktree-fail` (hạ tầng, đi theo ma trận hồi phục), không nuốt. Quét nghiên-cứu (discovery) và `fanout-batch` (pick -> execute -> return) commit theo cùng luật; driver tương tác commit phần worker để lại ở bước Commit của skill `fgos-coding-implement`.
  2. **Subject commit** là `summary` trong khối JSON Result của worker nếu có, ngược lại `<id>: <title>`. Bản ghi output cục bộ ghi `commit runner | self | none`.
  3. **Bỏ mọi grant git.** Mặc định `runner.executor` và `.fgos/config.json` (`claude-cli`, `glm`) không còn `--allowedTools` chứa `git add`/`git commit`; hợp đồng worker (Layer 2 rule 3) và prompt template bảo worker sửa file rồi dừng, không commit. Self-check Iron Law trong template đọc file đổi từ cây làm việc (runner commit sau).
  4. **Doctor** (`invocation-git-write-grants`) cảnh báo invocation/executor nào còn cấp `Bash(git add|commit)`; không tự xoá config của người dùng.
- **Hướng sau (không làm ở đây):** cho Work loop chạy hẳn qua Workflow runner (khớp hướng P3) — lớn hơn nhiều, và `loop.mjs` bị đánh CRITICAL; chỉ thay điểm commit, giữ nguyên vòng lặp.
- **Giới hạn đã biết:** `verifiedSha` do worker báo là tip của worker; sau runner commit tip đã đi qua nên `fgos return` chạy lại verify thay vì tin sha (an toàn, tốn thêm một lượt verify). Worker ở project khác dùng bản fgOS cũ vẫn tự commit được nếu config của họ còn grant — doctor chỉ ra.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_46e3a4ecadf497d511207c7a4e5c87a8

Source digest: 6597c805f92af65a56d56360287e9afe803302ee3f92f4cb3e4c4171455a2494

Target digest: 6597c805f92af65a56d56360287e9afe803302ee3f92f4cb3e4c4171455a2494

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-319",
  "sourceLines": [
    3170,
    3179
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0052 — Worker không bao giờ có quyền git: runner commit trên mọi đường (thay mục 2 của 0051) [ĐÃ BỊ THAY MỘT PHẦN bởi 0060]"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-178",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0052 — Worker không bao giờ có quyền git: runner commit trên mọi đường (thay mục 2 của 0051) [ĐÃ BỊ THAY MỘT PHẦN bởi 0060]"
  ],
  "nativeTargetClaimId": "claim_8d3d240f88a399c6a85f8d65b9770ad0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [
    {
      "oldSource": "docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051",
      "oldTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051",
      "currentSource": "docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "currentTarget": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060",
      "originalRow": "| `docs/specs/runner.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051` | `docs/platform/runner/decisions/h-36d872fbb0e5.md#0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051` | decision | split | Direct units of this heading only; nested headings have their own explicit row. Original headings retained; any new subdivision is Added in candidate. Source blob: `473a009662f22fb5d745e6ae151136da324d0d5e`. |",
      "rule": "P2 Lead decision: rebind stale source and target anchors; old row recorded as rebinding receipt, ownership now in additive current-heading row."
    }
  ],
  "decision": {
    "claimId": "claim_46e3a4ecadf497d511207c7a4e5c87a8",
    "sourceUnitDigest": "6597c805f92af65a56d56360287e9afe803302ee3f92f4cb3e4c4171455a2494",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-178",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-319 (lines 3170–3179) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-178. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6597c805f92af65a56d56360287e9afe803302ee3f92f4cb3e4c4171455a2494",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0052 — Worker không bao giờ có quyền git: runner commit trên mọi đường (thay mục 2 của 0051) [ĐÃ BỊ THAY MỘT PHẦN bởi 0060]"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-04). Thay thế mục 2 của 0051 ("quyền git của invocation KHÔNG bỏ"); mục 1 của 0051 giữ nguyên.
- **Bối cảnh:** 0051 giữ grant `git add`/`git commit` trên invocation không confine (`claude-cli`, `glm`, `runner.executor` mặc định) vì Work loop (`loop.mjs`) chưa có bước commit của runner — worker tự commit theo hợp đồng worker. Ngoại lệ có chủ đó kết thúc khi Work loop chuyển sang runner commit.
- **Quyết định:**
  1. **Runner commit trước goal-check.** Trong `loop.mjs`, sau khi worker trả về và trước `runGoalCheck`, runner gọi `commitUnitWork` (cùng hàm đường `fgos run` dùng: `git add -A` trừ `.fgos/`, identity của repo, rồi commit) trên worktree của item. Cây sạch → không commit (worker cũ vẫn tự commit, hoặc worker không đổi gì → goal-check xử lý như "nhánh không có commit", `verify-miss`). Commit lỗi → `worktree-fail` (hạ tầng, đi theo ma trận hồi phục), không nuốt. Quét nghiên-cứu (discovery) và `fanout-batch` (pick -> execute -> return) commit theo cùng luật; driver tương tác commit phần worker để lại ở bước Commit của skill `fgos-coding-implement`.
  2. **Subject commit** là `summary` trong khối JSON Result của worker nếu có, ngược lại `<id>: <title>`. Bản ghi output cục bộ ghi `commit runner | self | none`.
  3. **Bỏ mọi grant git.** Mặc định `runner.executor` và `.fgos/config.json` (`claude-cli`, `glm`) không còn `--allowedTools` chứa `git add`/`git commit`; hợp đồng worker (Layer 2 rule 3) và prompt template bảo worker sửa file rồi dừng, không commit. Self-check Iron Law trong template đọc file đổi từ cây làm việc (runner commit sau).
  4. **Doctor** (`invocation-git-write-grants`) cảnh báo invocation/executor nào còn cấp `Bash(git add|commit)`; không tự xoá config của người dùng.
- **Hướng sau (không làm ở đây):** cho Work loop chạy hẳn qua Workflow runner (khớp hướng P3) — lớn hơn nhiều, và `loop.mjs` bị đánh CRITICAL; chỉ thay điểm commit, giữ nguyên vòng lặp.
- **Giới hạn đã biết:** `verifiedSha` do worker báo là tip của worker; sau runner commit tip đã đi qua nên `fgos return` chạy lại verify thay vì tin sha (an toàn, tốn thêm một lượt verify). Worker ở project khác dùng bản fgOS cũ vẫn tự commit được nếu config của họ còn grant — doctor chỉ ra.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-04). Thay thế mục 2 của 0051 ("quyền git của invocation KHÔNG bỏ"); mục 1 của 0051 giữ nguyên.
- **Bối cảnh:** 0051 giữ grant `git add`/`git commit` trên invocation không confine (`claude-cli`, `glm`, `runner.executor` mặc định) vì Work loop (`loop.mjs`) chưa có bước commit của runner — worker tự commit theo hợp đồng worker. Ngoại lệ có chủ đó kết thúc khi Work loop chuyển sang runner commit.
- **Quyết định:**
  1. **Runner commit trước goal-check.** Trong `loop.mjs`, sau khi worker trả về và trước `runGoalCheck`, runner gọi `commitUnitWork` (cùng hàm đường `fgos run` dùng: `git add -A` trừ `.fgos/`, identity của repo, rồi commit) trên worktree của item. Cây sạch → không commit (worker cũ vẫn tự commit, hoặc worker không đổi gì → goal-check xử lý như "nhánh không có commit", `verify-miss`). Commit lỗi → `worktree-fail` (hạ tầng, đi theo ma trận hồi phục), không nuốt. Quét nghiên-cứu (discovery) và `fanout-batch` (pick -> execute -> return) commit theo cùng luật; driver tương tác commit phần worker để lại ở bước Commit của skill `fgos-coding-implement`.
  2. **Subject commit** là `summary` trong khối JSON Result của worker nếu có, ngược lại `<id>: <title>`. Bản ghi output cục bộ ghi `commit runner | self | none`.
  3. **Bỏ mọi grant git.** Mặc định `runner.executor` và `.fgos/config.json` (`claude-cli`, `glm`) không còn `--allowedTools` chứa `git add`/`git commit`; hợp đồng worker (Layer 2 rule 3) và prompt template bảo worker sửa file rồi dừng, không commit. Self-check Iron Law trong template đọc file đổi từ cây làm việc (runner commit sau).
  4. **Doctor** (`invocation-git-write-grants`) cảnh báo invocation/executor nào còn cấp `Bash(git add|commit)`; không tự xoá config của người dùng.
- **Hướng sau (không làm ở đây):** cho Work loop chạy hẳn qua Workflow runner (khớp hướng P3) — lớn hơn nhiều, và `loop.mjs` bị đánh CRITICAL; chỉ thay điểm commit, giữ nguyên vòng lặp.
- **Giới hạn đã biết:** `verifiedSha` do worker báo là tip của worker; sau runner commit tip đã đi qua nên `fgos return` chạy lại verify thay vì tin sha (an toàn, tốn thêm một lượt verify). Worker ở project khác dùng bản fgOS cũ vẫn tự commit được nếu config của họ còn grant — doctor chỉ ra.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_f9fd15e1ac6018eabd8bcfc94a50e77d

Source digest: 29f2185e7cf971134b645c8f61feebab3c998c90c66f8e6eee181adef6163279

Target digest: 29f2185e7cf971134b645c8f61feebab3c998c90c66f8e6eee181adef6163279

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần",
  "sourceLines": [
    3181,
    3181
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_38a5903347db71716cdb03270b7b2b1b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f9fd15e1ac6018eabd8bcfc94a50e77d",
    "sourceUnitDigest": "29f2185e7cf971134b645c8f61feebab3c998c90c66f8e6eee181adef6163279",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần (lines 3181–3181) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "29f2185e7cf971134b645c8f61feebab3c998c90c66f8e6eee181adef6163279",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0053 — Một cơ chế truyền kết quả: đường dẫn report trong contextRefs, phân giải một lần

- **Trạng thái:** Settled (2026-10-05)
- **Bối cảnh:** Có hai đường truyền kết quả. Giữa các vai trong một Unit run là đường dẫn trong `contextRefs`; giữa các bước Workflow là text nhúng vào objective, tối đa 6000 ký tự của report cuối mỗi unit, tìm report bằng tên file (`agent-report.md`) nên bỏ sót `report-N.md` của herdr, và chỉ giữ kết quả cuối nên một bước `panel` chỉ còn synthesizer. Ref `unit-run:<id>/<role>` được validate nhưng không bao giờ phân giải, worker nhận một chuỗi không phải đường dẫn. Store của Workflow không giữ unit run id nên không dựng được ref.
- **Quyết định:**
  1. **Một dạng:** đường dẫn tuyệt đối, chỉ đọc, tới report, trong `contextRefs`; không còn đường nhúng text. Xoá giới hạn 6000 ký tự, tìm report theo tên file và `role-input-refs.mjs`.
  2. **Một chỗ phân giải** trong Execution Core (`handoff-refs.mjs`), lúc tạo Unit run, kết quả ghi vào `unit.json` (`resolvedInputs`). Report lấy từ `settleReports` (đã kiểm sha256), không đoán theo tên file.
  3. **Workflow store ghi `unitRunId`** ngay khi Unit run được tạo (event `unit.started`, trước ghế đầu tiên) và lặp lại trên `unit.complete`; một unit đang `running` có id được runner tiếp tục bằng `resumeUnitRunId` (ghế đã settle không chạy lại, worktree đã ghi được dùng lại) thay vì tạo Unit run mới; bước sau thấy report của mọi vai của mọi bước phụ thuộc, như trước.
  4. Không mở rộng quyền đọc của worker (xem "Ranh giới tin cậy" ở `docs/routing-handoff-contract.md`); không đổi ranh giới component.
- **Giới hạn đã biết:** worker phải mở file; câu `Summary` giữ trong objective làm sàn khi một model bỏ qua ref. Câu trả lời của cổng người chưa tới unit sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0053 — Một cơ chế truyền kết quả: đường dẫn report trong contextRefs, phân giải một lần

- **Trạng thái:** Settled (2026-10-05)
- **Bối cảnh:** Có hai đường truyền kết quả. Giữa các vai trong một Unit run là đường dẫn trong `contextRefs`; giữa các bước Workflow là text nhúng vào objective, tối đa 6000 ký tự của report cuối mỗi unit, tìm report bằng tên file (`agent-report.md`) nên bỏ sót `report-N.md` của herdr, và chỉ giữ kết quả cuối nên một bước `panel` chỉ còn synthesizer. Ref `unit-run:<id>/<role>` được validate nhưng không bao giờ phân giải, worker nhận một chuỗi không phải đường dẫn. Store của Workflow không giữ unit run id nên không dựng được ref.
- **Quyết định:**
  1. **Một dạng:** đường dẫn tuyệt đối, chỉ đọc, tới report, trong `contextRefs`; không còn đường nhúng text. Xoá giới hạn 6000 ký tự, tìm report theo tên file và `role-input-refs.mjs`.
  2. **Một chỗ phân giải** trong Execution Core (`handoff-refs.mjs`), lúc tạo Unit run, kết quả ghi vào `unit.json` (`resolvedInputs`). Report lấy từ `settleReports` (đã kiểm sha256), không đoán theo tên file.
  3. **Workflow store ghi `unitRunId`** ngay khi Unit run được tạo (event `unit.started`, trước ghế đầu tiên) và lặp lại trên `unit.complete`; một unit đang `running` có id được runner tiếp tục bằng `resumeUnitRunId` (ghế đã settle không chạy lại, worktree đã ghi được dùng lại) thay vì tạo Unit run mới; bước sau thấy report của mọi vai của mọi bước phụ thuộc, như trước.
  4. Không mở rộng quyền đọc của worker (xem "Ranh giới tin cậy" ở `docs/routing-handoff-contract.md`); không đổi ranh giới component.
- **Giới hạn đã biết:** worker phải mở file; câu `Summary` giữ trong objective làm sàn khi một model bỏ qua ref. Câu trả lời của cổng người chưa tới unit sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_9152712f05f3390687f5b4d9ef102e75

Source digest: 6adc7286a12983c2a05c64d6dce33d420d981369a2a0f7c019aa91445e84285f

Target digest: 6adc7286a12983c2a05c64d6dce33d420d981369a2a0f7c019aa91445e84285f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-320",
  "sourceLines": [
    3183,
    3191
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0053 — Một cơ chế truyền kết quả: đường dẫn report trong contextRefs, phân giải một lần"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-179",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0053 — Một cơ chế truyền kết quả: đường dẫn report trong contextRefs, phân giải một lần"
  ],
  "nativeTargetClaimId": "claim_2a612f2abc1c1a8eddd073ca7ac8daa0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9152712f05f3390687f5b4d9ef102e75",
    "sourceUnitDigest": "6adc7286a12983c2a05c64d6dce33d420d981369a2a0f7c019aa91445e84285f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-179",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-320 (lines 3183–3191) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-179. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6adc7286a12983c2a05c64d6dce33d420d981369a2a0f7c019aa91445e84285f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0053 — Một cơ chế truyền kết quả: đường dẫn report trong contextRefs, phân giải một lần"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-05)
- **Bối cảnh:** Có hai đường truyền kết quả. Giữa các vai trong một Unit run là đường dẫn trong `contextRefs`; giữa các bước Workflow là text nhúng vào objective, tối đa 6000 ký tự của report cuối mỗi unit, tìm report bằng tên file (`agent-report.md`) nên bỏ sót `report-N.md` của herdr, và chỉ giữ kết quả cuối nên một bước `panel` chỉ còn synthesizer. Ref `unit-run:<id>/<role>` được validate nhưng không bao giờ phân giải, worker nhận một chuỗi không phải đường dẫn. Store của Workflow không giữ unit run id nên không dựng được ref.
- **Quyết định:**
  1. **Một dạng:** đường dẫn tuyệt đối, chỉ đọc, tới report, trong `contextRefs`; không còn đường nhúng text. Xoá giới hạn 6000 ký tự, tìm report theo tên file và `role-input-refs.mjs`.
  2. **Một chỗ phân giải** trong Execution Core (`handoff-refs.mjs`), lúc tạo Unit run, kết quả ghi vào `unit.json` (`resolvedInputs`). Report lấy từ `settleReports` (đã kiểm sha256), không đoán theo tên file.
  3. **Workflow store ghi `unitRunId`** ngay khi Unit run được tạo (event `unit.started`, trước ghế đầu tiên) và lặp lại trên `unit.complete`; một unit đang `running` có id được runner tiếp tục bằng `resumeUnitRunId` (ghế đã settle không chạy lại, worktree đã ghi được dùng lại) thay vì tạo Unit run mới; bước sau thấy report của mọi vai của mọi bước phụ thuộc, như trước.
  4. Không mở rộng quyền đọc của worker (xem "Ranh giới tin cậy" ở `docs/routing-handoff-contract.md`); không đổi ranh giới component.
- **Giới hạn đã biết:** worker phải mở file; câu `Summary` giữ trong objective làm sàn khi một model bỏ qua ref. Câu trả lời của cổng người chưa tới unit sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-05)
- **Bối cảnh:** Có hai đường truyền kết quả. Giữa các vai trong một Unit run là đường dẫn trong `contextRefs`; giữa các bước Workflow là text nhúng vào objective, tối đa 6000 ký tự của report cuối mỗi unit, tìm report bằng tên file (`agent-report.md`) nên bỏ sót `report-N.md` của herdr, và chỉ giữ kết quả cuối nên một bước `panel` chỉ còn synthesizer. Ref `unit-run:<id>/<role>` được validate nhưng không bao giờ phân giải, worker nhận một chuỗi không phải đường dẫn. Store của Workflow không giữ unit run id nên không dựng được ref.
- **Quyết định:**
  1. **Một dạng:** đường dẫn tuyệt đối, chỉ đọc, tới report, trong `contextRefs`; không còn đường nhúng text. Xoá giới hạn 6000 ký tự, tìm report theo tên file và `role-input-refs.mjs`.
  2. **Một chỗ phân giải** trong Execution Core (`handoff-refs.mjs`), lúc tạo Unit run, kết quả ghi vào `unit.json` (`resolvedInputs`). Report lấy từ `settleReports` (đã kiểm sha256), không đoán theo tên file.
  3. **Workflow store ghi `unitRunId`** ngay khi Unit run được tạo (event `unit.started`, trước ghế đầu tiên) và lặp lại trên `unit.complete`; một unit đang `running` có id được runner tiếp tục bằng `resumeUnitRunId` (ghế đã settle không chạy lại, worktree đã ghi được dùng lại) thay vì tạo Unit run mới; bước sau thấy report của mọi vai của mọi bước phụ thuộc, như trước.
  4. Không mở rộng quyền đọc của worker (xem "Ranh giới tin cậy" ở `docs/routing-handoff-contract.md`); không đổi ranh giới component.
- **Giới hạn đã biết:** worker phải mở file; câu `Summary` giữ trong objective làm sàn khi một model bỏ qua ref. Câu trả lời của cổng người chưa tới unit sau.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_f58bf45ca4affd0474b1e864c26c6e62

Source digest: 75dc85e0ed4a197a26329a68c01c7d0414ca8e2399e893bceb75c4545d9319b3

Target digest: 75dc85e0ed4a197a26329a68c01c7d0414ca8e2399e893bceb75c4545d9319b3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
  "sourceLines": [
    3193,
    3193
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_6700f723cca794c7aafd13c8b38ec256",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f58bf45ca4affd0474b1e864c26c6e62",
    "sourceUnitDigest": "75dc85e0ed4a197a26329a68c01c7d0414ca8e2399e893bceb75c4545d9319b3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng (lines 3193–3193) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "75dc85e0ed4a197a26329a68c01c7d0414ca8e2399e893bceb75c4545d9319b3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0055 — Panel: khác họ provider giữa các ghế là ưu tiên mềm, `bind()` rải ghế theo thứ tự `prefer`; `reviewed` vẫn cứng

- **Trạng thái:** Settled (owner, 2026-10-11). Thay thế quy tắc "mỗi ghế panel một họ provider khác nhau, thiếu thì từ chối" của `independentOf` cho `panel` (đặt ở abe6f2b3c, Wave B; role name resolve về executor ở 5f915db15; synthesizer bắt buộc khác họ ở 9420cf603). Phần `reviewed` (producer ≠ checker) và ngoại lệ `acceptDependence` (override `origin: human-cli`) không đổi.
- **Bối cảnh:** `panel.mjs` cho mỗi panelist `independentOf` = mọi panelist khác và cho synthesizer `independentOf` = mọi panelist; `bind()` từ chối ứng viên cùng họ trừ khi có waiver của người. Số ghế vì vậy bị chặn bởi số họ provider dùng được (5 ở máy này, đa số người dùng ít hơn) và pool thiếu họ thì synthesizer bị `policy-refusal` sau khi các panelist đã chạy và tốn tiền. Cùng họ giữa các ghế làm giảm độc lập nhưng không làm panel vô nghĩa; từ chối là hậu quả quá nặng so với lợi ích.
- **Quyết định:**
  1. **Ưu tiên mềm, không bao giờ từ chối.** `runRole` nhận thêm `preferIndependentOf` (tên vai) tách khỏi `independentOf` cứng. `panel.mjs` chỉ KHAI: mỗi panelist ưu tiên khác mọi panelist còn lại, synthesizer ưu tiên khác mọi panelist; không nêu executor/họ/tier. `independentOf` (cứng) vẫn do `reviewed` dùng.
  2. **Lựa chọn ở `bind()`, một nơi.** `ask.preferIndependentOf` là `[{ role, executor }]` của các ghế ĐÃ bind (runner/dry-bind lấy từ `role-ledger.mjs`, hàm `seats`; mảng rỗng cho ghế đầu, vắng mặt khi vai không xin rải). `bind()` vẫn lọc governance, độc lập cứng, posture, blind như cũ rồi, trong số ứng viên còn lại, chọn họ có ÍT ghế đã dùng nhất (họ chưa ai dùng = 0), hoà thì theo thứ tự `prefer` của capability (thứ tự do owner tuyển, tái dùng). Đủ họ thì ghế rơi vào họ khác nhau theo thứ tự pool như trước; hết họ thì ghế dùng chung họ ít dùng nhất. Không có bảng sức mạnh họ, bảng persona→họ, registry hay khoá config mới.
  3. **Thứ tự bind xác định.** Các panelist bind theo thứ tự liệt kê, đồng bộ trong cùng một tick (trong `runRole` không có `await` giữa `bind` và `noteRoleExecutor`), nên ghế k chỉ thấy các ghế liệt kê trước nó (cộng ghế mà lần chạy resume đã ghi); synthesizer bind sau khi mọi panelist xong. Thứ tự liệt kê = thứ tự ưu tiên: ghế đứng trước được chọn trước. Nhu cầu theo ghế (rigor/tier riêng từng ghế) chưa có kênh per-seat nên để việc sau; bước này chỉ dùng thứ tự ghế.
  4. **Minh bạch.** Binding ghi `provenance.familySpread = { value: { family, sharedWith: [vai...] }, source }`, `source` là `prefer-independent-of:distinct-family` hoặc `prefer-independent-of:no-eligible-unused-family`. `unit-summary.read.v2` thêm khoá tuỳ chọn `sharedFamilies: [{ family, seats: ["<vai>/<vòng>", ...] }]`, chỉ có khi ≥2 ghế cuối cùng chung một họ (đối xứng, khác `sharedWith` chỉ nhìn về các ghế bind trước); thêm khoá tuỳ chọn nên giữ version 2, summary cũ giữ nguyên byte. Doctor `workflow-pools-satisfy-independence` chỉ còn fail với `reviewed`; panel thiếu họ được báo bằng ghi chú nêu ghế nào chung họ.
- **Tái dùng / đổi:** tái dùng `role-ledger.mjs`, hợp đồng `ask`/provenance của `bind()`, thứ tự `prefer`, `unit-summary`; đổi cách `panel.mjs` khai ý định, và cách `bind()` xếp hạng ứng viên khi có `preferIndependentOf`. Không có cơ chế nào làm synthesizer cứng trở lại (không có mechanism sẵn).
- **Ranh giới:** No component-boundary change. Quyền chọn executor/họ vẫn chỉ ở `bind()` (Execution Core); `panel.mjs` (Collaboration Patterns) chỉ khai ý định, workflow YAML vẫn từ chối executor/provider/model/tier/invocation/prefer/overrides.
- **Giới hạn đã biết:** cổng ghi file tính lại `bind()` không mang `preferIndependentOf` (chỉ producer ghi file đi qua cổng, producer không xin rải). Một ghế `synthesizer` ghi file sẽ phải được xem lại nếu có.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0055 — Panel: khác họ provider giữa các ghế là ưu tiên mềm, `bind()` rải ghế theo thứ tự `prefer`; `reviewed` vẫn cứng

- **Trạng thái:** Settled (owner, 2026-10-11). Thay thế quy tắc "mỗi ghế panel một họ provider khác nhau, thiếu thì từ chối" của `independentOf` cho `panel` (đặt ở abe6f2b3c, Wave B; role name resolve về executor ở 5f915db15; synthesizer bắt buộc khác họ ở 9420cf603). Phần `reviewed` (producer ≠ checker) và ngoại lệ `acceptDependence` (override `origin: human-cli`) không đổi.
- **Bối cảnh:** `panel.mjs` cho mỗi panelist `independentOf` = mọi panelist khác và cho synthesizer `independentOf` = mọi panelist; `bind()` từ chối ứng viên cùng họ trừ khi có waiver của người. Số ghế vì vậy bị chặn bởi số họ provider dùng được (5 ở máy này, đa số người dùng ít hơn) và pool thiếu họ thì synthesizer bị `policy-refusal` sau khi các panelist đã chạy và tốn tiền. Cùng họ giữa các ghế làm giảm độc lập nhưng không làm panel vô nghĩa; từ chối là hậu quả quá nặng so với lợi ích.
- **Quyết định:**
  1. **Ưu tiên mềm, không bao giờ từ chối.** `runRole` nhận thêm `preferIndependentOf` (tên vai) tách khỏi `independentOf` cứng. `panel.mjs` chỉ KHAI: mỗi panelist ưu tiên khác mọi panelist còn lại, synthesizer ưu tiên khác mọi panelist; không nêu executor/họ/tier. `independentOf` (cứng) vẫn do `reviewed` dùng.
  2. **Lựa chọn ở `bind()`, một nơi.** `ask.preferIndependentOf` là `[{ role, executor }]` của các ghế ĐÃ bind (runner/dry-bind lấy từ `role-ledger.mjs`, hàm `seats`; mảng rỗng cho ghế đầu, vắng mặt khi vai không xin rải). `bind()` vẫn lọc governance, độc lập cứng, posture, blind như cũ rồi, trong số ứng viên còn lại, chọn họ có ÍT ghế đã dùng nhất (họ chưa ai dùng = 0), hoà thì theo thứ tự `prefer` của capability (thứ tự do owner tuyển, tái dùng). Đủ họ thì ghế rơi vào họ khác nhau theo thứ tự pool như trước; hết họ thì ghế dùng chung họ ít dùng nhất. Không có bảng sức mạnh họ, bảng persona→họ, registry hay khoá config mới.
  3. **Thứ tự bind xác định.** Các panelist bind theo thứ tự liệt kê, đồng bộ trong cùng một tick (trong `runRole` không có `await` giữa `bind` và `noteRoleExecutor`), nên ghế k chỉ thấy các ghế liệt kê trước nó (cộng ghế mà lần chạy resume đã ghi); synthesizer bind sau khi mọi panelist xong. Thứ tự liệt kê = thứ tự ưu tiên: ghế đứng trước được chọn trước. Nhu cầu theo ghế (rigor/tier riêng từng ghế) chưa có kênh per-seat nên để việc sau; bước này chỉ dùng thứ tự ghế.
  4. **Minh bạch.** Binding ghi `provenance.familySpread = { value: { family, sharedWith: [vai...] }, source }`, `source` là `prefer-independent-of:distinct-family` hoặc `prefer-independent-of:no-eligible-unused-family`. `unit-summary.read.v2` thêm khoá tuỳ chọn `sharedFamilies: [{ family, seats: ["<vai>/<vòng>", ...] }]`, chỉ có khi ≥2 ghế cuối cùng chung một họ (đối xứng, khác `sharedWith` chỉ nhìn về các ghế bind trước); thêm khoá tuỳ chọn nên giữ version 2, summary cũ giữ nguyên byte. Doctor `workflow-pools-satisfy-independence` chỉ còn fail với `reviewed`; panel thiếu họ được báo bằng ghi chú nêu ghế nào chung họ.
- **Tái dùng / đổi:** tái dùng `role-ledger.mjs`, hợp đồng `ask`/provenance của `bind()`, thứ tự `prefer`, `unit-summary`; đổi cách `panel.mjs` khai ý định, và cách `bind()` xếp hạng ứng viên khi có `preferIndependentOf`. Không có cơ chế nào làm synthesizer cứng trở lại (không có mechanism sẵn).
- **Ranh giới:** No component-boundary change. Quyền chọn executor/họ vẫn chỉ ở `bind()` (Execution Core); `panel.mjs` (Collaboration Patterns) chỉ khai ý định, workflow YAML vẫn từ chối executor/provider/model/tier/invocation/prefer/overrides.
- **Giới hạn đã biết:** cổng ghi file tính lại `bind()` không mang `preferIndependentOf` (chỉ producer ghi file đi qua cổng, producer không xin rải). Một ghế `synthesizer` ghi file sẽ phải được xem lại nếu có.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_a2f67de75a538ea78e1bb035e6d1c0a9

Source digest: 0e93cfa2f85e0e2dc551cea9ca8232742dd7c313288eb665c3a2e7e0bd1b84ac

Target digest: 0e93cfa2f85e0e2dc551cea9ca8232742dd7c313288eb665c3a2e7e0bd1b84ac

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-321",
  "sourceLines": [
    3195,
    3205
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0055 — Panel: khác họ provider giữa các ghế là ưu tiên mềm, `bind()` rải ghế theo thứ tự `prefer`; `reviewed` vẫn cứng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-180",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0055 — Panel: khác họ provider giữa các ghế là ưu tiên mềm, `bind()` rải ghế theo thứ tự `prefer`; `reviewed` vẫn cứng"
  ],
  "nativeTargetClaimId": "claim_d9f50ed4afd00164bf8fa01d270482da",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a2f67de75a538ea78e1bb035e6d1c0a9",
    "sourceUnitDigest": "0e93cfa2f85e0e2dc551cea9ca8232742dd7c313288eb665c3a2e7e0bd1b84ac",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-180",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-321 (lines 3195–3205) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-180. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0e93cfa2f85e0e2dc551cea9ca8232742dd7c313288eb665c3a2e7e0bd1b84ac",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0055 — Panel: khác họ provider giữa các ghế là ưu tiên mềm, `bind()` rải ghế theo thứ tự `prefer`; `reviewed` vẫn cứng"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (owner, 2026-10-11). Thay thế quy tắc "mỗi ghế panel một họ provider khác nhau, thiếu thì từ chối" của `independentOf` cho `panel` (đặt ở abe6f2b3c, Wave B; role name resolve về executor ở 5f915db15; synthesizer bắt buộc khác họ ở 9420cf603). Phần `reviewed` (producer ≠ checker) và ngoại lệ `acceptDependence` (override `origin: human-cli`) không đổi.
- **Bối cảnh:** `panel.mjs` cho mỗi panelist `independentOf` = mọi panelist khác và cho synthesizer `independentOf` = mọi panelist; `bind()` từ chối ứng viên cùng họ trừ khi có waiver của người. Số ghế vì vậy bị chặn bởi số họ provider dùng được (5 ở máy này, đa số người dùng ít hơn) và pool thiếu họ thì synthesizer bị `policy-refusal` sau khi các panelist đã chạy và tốn tiền. Cùng họ giữa các ghế làm giảm độc lập nhưng không làm panel vô nghĩa; từ chối là hậu quả quá nặng so với lợi ích.
- **Quyết định:**
  1. **Ưu tiên mềm, không bao giờ từ chối.** `runRole` nhận thêm `preferIndependentOf` (tên vai) tách khỏi `independentOf` cứng. `panel.mjs` chỉ KHAI: mỗi panelist ưu tiên khác mọi panelist còn lại, synthesizer ưu tiên khác mọi panelist; không nêu executor/họ/tier. `independentOf` (cứng) vẫn do `reviewed` dùng.
  2. **Lựa chọn ở `bind()`, một nơi.** `ask.preferIndependentOf` là `[{ role, executor }]` của các ghế ĐÃ bind (runner/dry-bind lấy từ `role-ledger.mjs`, hàm `seats`; mảng rỗng cho ghế đầu, vắng mặt khi vai không xin rải). `bind()` vẫn lọc governance, độc lập cứng, posture, blind như cũ rồi, trong số ứng viên còn lại, chọn họ có ÍT ghế đã dùng nhất (họ chưa ai dùng = 0), hoà thì theo thứ tự `prefer` của capability (thứ tự do owner tuyển, tái dùng). Đủ họ thì ghế rơi vào họ khác nhau theo thứ tự pool như trước; hết họ thì ghế dùng chung họ ít dùng nhất. Không có bảng sức mạnh họ, bảng persona→họ, registry hay khoá config mới.
  3. **Thứ tự bind xác định.** Các panelist bind theo thứ tự liệt kê, đồng bộ trong cùng một tick (trong `runRole` không có `await` giữa `bind` và `noteRoleExecutor`), nên ghế k chỉ thấy các ghế liệt kê trước nó (cộng ghế mà lần chạy resume đã ghi); synthesizer bind sau khi mọi panelist xong. Thứ tự liệt kê = thứ tự ưu tiên: ghế đứng trước được chọn trước. Nhu cầu theo ghế (rigor/tier riêng từng ghế) chưa có kênh per-seat nên để việc sau; bước này chỉ dùng thứ tự ghế.
  4. **Minh bạch.** Binding ghi `provenance.familySpread = { value: { family, sharedWith: [vai...] }, source }`, `source` là `prefer-independent-of:distinct-family` hoặc `prefer-independent-of:no-eligible-unused-family`. `unit-summary.read.v2` thêm khoá tuỳ chọn `sharedFamilies: [{ family, seats: ["<vai>/<vòng>", ...] }]`, chỉ có khi ≥2 ghế cuối cùng chung một họ (đối xứng, khác `sharedWith` chỉ nhìn về các ghế bind trước); thêm khoá tuỳ chọn nên giữ version 2, summary cũ giữ nguyên byte. Doctor `workflow-pools-satisfy-independence` chỉ còn fail với `reviewed`; panel thiếu họ được báo bằng ghi chú nêu ghế nào chung họ.
- **Tái dùng / đổi:** tái dùng `role-ledger.mjs`, hợp đồng `ask`/provenance của `bind()`, thứ tự `prefer`, `unit-summary`; đổi cách `panel.mjs` khai ý định, và cách `bind()` xếp hạng ứng viên khi có `preferIndependentOf`. Không có cơ chế nào làm synthesizer cứng trở lại (không có mechanism sẵn).
- **Ranh giới:** No component-boundary change. Quyền chọn executor/họ vẫn chỉ ở `bind()` (Execution Core); `panel.mjs` (Collaboration Patterns) chỉ khai ý định, workflow YAML vẫn từ chối executor/provider/model/tier/invocation/prefer/overrides.
- **Giới hạn đã biết:** cổng ghi file tính lại `bind()` không mang `preferIndependentOf` (chỉ producer ghi file đi qua cổng, producer không xin rải). Một ghế `synthesizer` ghi file sẽ phải được xem lại nếu có.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (owner, 2026-10-11). Thay thế quy tắc "mỗi ghế panel một họ provider khác nhau, thiếu thì từ chối" của `independentOf` cho `panel` (đặt ở abe6f2b3c, Wave B; role name resolve về executor ở 5f915db15; synthesizer bắt buộc khác họ ở 9420cf603). Phần `reviewed` (producer ≠ checker) và ngoại lệ `acceptDependence` (override `origin: human-cli`) không đổi.
- **Bối cảnh:** `panel.mjs` cho mỗi panelist `independentOf` = mọi panelist khác và cho synthesizer `independentOf` = mọi panelist; `bind()` từ chối ứng viên cùng họ trừ khi có waiver của người. Số ghế vì vậy bị chặn bởi số họ provider dùng được (5 ở máy này, đa số người dùng ít hơn) và pool thiếu họ thì synthesizer bị `policy-refusal` sau khi các panelist đã chạy và tốn tiền. Cùng họ giữa các ghế làm giảm độc lập nhưng không làm panel vô nghĩa; từ chối là hậu quả quá nặng so với lợi ích.
- **Quyết định:**
  1. **Ưu tiên mềm, không bao giờ từ chối.** `runRole` nhận thêm `preferIndependentOf` (tên vai) tách khỏi `independentOf` cứng. `panel.mjs` chỉ KHAI: mỗi panelist ưu tiên khác mọi panelist còn lại, synthesizer ưu tiên khác mọi panelist; không nêu executor/họ/tier. `independentOf` (cứng) vẫn do `reviewed` dùng.
  2. **Lựa chọn ở `bind()`, một nơi.** `ask.preferIndependentOf` là `[{ role, executor }]` của các ghế ĐÃ bind (runner/dry-bind lấy từ `role-ledger.mjs`, hàm `seats`; mảng rỗng cho ghế đầu, vắng mặt khi vai không xin rải). `bind()` vẫn lọc governance, độc lập cứng, posture, blind như cũ rồi, trong số ứng viên còn lại, chọn họ có ÍT ghế đã dùng nhất (họ chưa ai dùng = 0), hoà thì theo thứ tự `prefer` của capability (thứ tự do owner tuyển, tái dùng). Đủ họ thì ghế rơi vào họ khác nhau theo thứ tự pool như trước; hết họ thì ghế dùng chung họ ít dùng nhất. Không có bảng sức mạnh họ, bảng persona→họ, registry hay khoá config mới.
  3. **Thứ tự bind xác định.** Các panelist bind theo thứ tự liệt kê, đồng bộ trong cùng một tick (trong `runRole` không có `await` giữa `bind` và `noteRoleExecutor`), nên ghế k chỉ thấy các ghế liệt kê trước nó (cộng ghế mà lần chạy resume đã ghi); synthesizer bind sau khi mọi panelist xong. Thứ tự liệt kê = thứ tự ưu tiên: ghế đứng trước được chọn trước. Nhu cầu theo ghế (rigor/tier riêng từng ghế) chưa có kênh per-seat nên để việc sau; bước này chỉ dùng thứ tự ghế.
  4. **Minh bạch.** Binding ghi `provenance.familySpread = { value: { family, sharedWith: [vai...] }, source }`, `source` là `prefer-independent-of:distinct-family` hoặc `prefer-independent-of:no-eligible-unused-family`. `unit-summary.read.v2` thêm khoá tuỳ chọn `sharedFamilies: [{ family, seats: ["<vai>/<vòng>", ...] }]`, chỉ có khi ≥2 ghế cuối cùng chung một họ (đối xứng, khác `sharedWith` chỉ nhìn về các ghế bind trước); thêm khoá tuỳ chọn nên giữ version 2, summary cũ giữ nguyên byte. Doctor `workflow-pools-satisfy-independence` chỉ còn fail với `reviewed`; panel thiếu họ được báo bằng ghi chú nêu ghế nào chung họ.
- **Tái dùng / đổi:** tái dùng `role-ledger.mjs`, hợp đồng `ask`/provenance của `bind()`, thứ tự `prefer`, `unit-summary`; đổi cách `panel.mjs` khai ý định, và cách `bind()` xếp hạng ứng viên khi có `preferIndependentOf`. Không có cơ chế nào làm synthesizer cứng trở lại (không có mechanism sẵn).
- **Ranh giới:** No component-boundary change. Quyền chọn executor/họ vẫn chỉ ở `bind()` (Execution Core); `panel.mjs` (Collaboration Patterns) chỉ khai ý định, workflow YAML vẫn từ chối executor/provider/model/tier/invocation/prefer/overrides.
- **Giới hạn đã biết:** cổng ghi file tính lại `bind()` không mang `preferIndependentOf` (chỉ producer ghi file đi qua cổng, producer không xin rải). Một ghế `synthesizer` ghi file sẽ phải được xem lại nếu có.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_5e6715ecc0c3c71e135748edf54d4271

Source digest: 72ebb5b0a96c61934e736eae2046edd32750afbf69a82309e533f81a55b9da1c

Target digest: 72ebb5b0a96c61934e736eae2046edd32750afbf69a82309e533f81a55b9da1c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
  "sourceLines": [
    3207,
    3207
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_4df5492e723122293f0966632003061a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5e6715ecc0c3c71e135748edf54d4271",
    "sourceUnitDigest": "72ebb5b0a96c61934e736eae2046edd32750afbf69a82309e533f81a55b9da1c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry (lines 3207–3207) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "72ebb5b0a96c61934e736eae2046edd32750afbf69a82309e533f81a55b9da1c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0056 — `--seats`: chuyên biệt hoá ghế panel bằng lens khi khởi động, không thêm workflow YAML hay registry

- **Trạng thái:** Settled (owner, 2026-10-11), phạm vi giai đoạn 1: lens inline. Persona có tên (`@name`) là giai đoạn sau, hiện bị từ chối rõ ràng.
- **Bối cảnh:** Các base thảo luận có panel chung (3 ghế mặc định không khác nhau) nên một câu hỏi theo miền (tài chính, nhân sự) không chỉ ra được góc nhìn cần có. Thêm một workflow YAML cho mỗi miền là ngôn ngữ workflow thứ hai; một file recipe là carrier mới cho thứ mà một cờ đã chứa được. Số ghế không còn bị chặn bởi số họ provider (decision 0055), nên số lens không cần trần ở schema.
- **Quyết định:**
  1. **Một cờ tuỳ chọn** `fgos workflow start <base> --seats "a|b|c"`, phản chiếu `--stance-options`. Chỉ phân tích cú pháp ở CLI; chuyên biệt hoá thuộc Workflow component (`src/workflow/seats.mjs`), thuần và xác định (không đồng hồ, ngẫu nhiên, model), chạy trong `prepareWorkflowRun` trước khi tạo run nên đầu vào sai không tạo run, không mở pane.
  2. **Đủ điều kiện theo cấu trúc:** unit `panel` mà `roleTasks` không có khoá `panelist-N` và không có `params.role` tuỳ chỉnh. Base có panel được dựng riêng (`council-lite`, `architecture-advisory`) hoặc không có panel chung (`architecture-advisory-reopen`, plan dịch từ plan.md) bị từ chối kèm lý do. Không có danh sách cứng.
  3. **Chỉ đổi trường ghế:** `params.members`, `roleTasks.panelist-1..N` (một câu hằng của runtime, lens là tiêu điểm phân tích, không phải danh tính hay chỉ thị), cộng chép tường minh `--context-ref` dùng chung vào template của mọi unit ở bước có `dependsOn` (vì ref cấp run chỉ tới bước gốc). Topology, gate, `blind`, nhiệm vụ checker, văn bản synthesizer giữ nguyên; revalidate bằng đúng validator. Delphi dùng cùng ánh xạ ghế ở cả hai vòng.
  4. **Cấm trong bề mặt recipe:** số ghế riêng, vòng, blind, gate, critique, chọn synthesizer, steps/edges, `roleTasks` thô, provider/model/executor/tier/invocation/prefer/overrides/acceptDependence. Chọn base khác thay vì vá base.
  5. **Preflight không từ chối vì họ provider:** dry-bind lại các unit panel đã mở rộng với `{pattern, params}` đầy đủ (wrapper của doctor bỏ `template.params` nên không dùng); ghế chung họ chỉ cảnh báo (`seatsPreflight`), chỉ từ chối khi một vai không có ứng viên nào. Doctor không cần đổi: không thêm mặc định cấu hình, biến môi trường hay file bắt buộc.
  6. **Lưu và resume:** định nghĩa đã mở rộng nằm trong event `workflow.start` hiện có cùng bản ghi nguồn gốc `{seats, baseId, baseDigest, refs}`, projection phơi `seats`; status/resume đọc dữ liệu đã lưu, không mở rộng lại. `workflow resume --seats` khác giá trị đã lưu bị từ chối; không truyền thì giữ như cũ.
- **Ranh giới:** No component-boundary change. Chọn executor/họ vẫn chỉ ở `bind()`; `panel.mjs` không đổi; Workflow component vẫn không biết executor.
- **Giới hạn đã biết:** nội dung `--context-ref` được đọc lúc chạy, không đóng băng. Lens là văn bản do model viết: được chặn bằng độ dài, một dòng, không ngoặc nhọn và câu mẫu cố định, nhưng không biến nội dung tuỳ ý thành an toàn; recipe không cấp quyền. Persona có tên, thư mục `fgos/agents` và pin nội dung persona lúc start chưa làm.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0056 — `--seats`: chuyên biệt hoá ghế panel bằng lens khi khởi động, không thêm workflow YAML hay registry

- **Trạng thái:** Settled (owner, 2026-10-11), phạm vi giai đoạn 1: lens inline. Persona có tên (`@name`) là giai đoạn sau, hiện bị từ chối rõ ràng.
- **Bối cảnh:** Các base thảo luận có panel chung (3 ghế mặc định không khác nhau) nên một câu hỏi theo miền (tài chính, nhân sự) không chỉ ra được góc nhìn cần có. Thêm một workflow YAML cho mỗi miền là ngôn ngữ workflow thứ hai; một file recipe là carrier mới cho thứ mà một cờ đã chứa được. Số ghế không còn bị chặn bởi số họ provider (decision 0055), nên số lens không cần trần ở schema.
- **Quyết định:**
  1. **Một cờ tuỳ chọn** `fgos workflow start <base> --seats "a|b|c"`, phản chiếu `--stance-options`. Chỉ phân tích cú pháp ở CLI; chuyên biệt hoá thuộc Workflow component (`src/workflow/seats.mjs`), thuần và xác định (không đồng hồ, ngẫu nhiên, model), chạy trong `prepareWorkflowRun` trước khi tạo run nên đầu vào sai không tạo run, không mở pane.
  2. **Đủ điều kiện theo cấu trúc:** unit `panel` mà `roleTasks` không có khoá `panelist-N` và không có `params.role` tuỳ chỉnh. Base có panel được dựng riêng (`council-lite`, `architecture-advisory`) hoặc không có panel chung (`architecture-advisory-reopen`, plan dịch từ plan.md) bị từ chối kèm lý do. Không có danh sách cứng.
  3. **Chỉ đổi trường ghế:** `params.members`, `roleTasks.panelist-1..N` (một câu hằng của runtime, lens là tiêu điểm phân tích, không phải danh tính hay chỉ thị), cộng chép tường minh `--context-ref` dùng chung vào template của mọi unit ở bước có `dependsOn` (vì ref cấp run chỉ tới bước gốc). Topology, gate, `blind`, nhiệm vụ checker, văn bản synthesizer giữ nguyên; revalidate bằng đúng validator. Delphi dùng cùng ánh xạ ghế ở cả hai vòng.
  4. **Cấm trong bề mặt recipe:** số ghế riêng, vòng, blind, gate, critique, chọn synthesizer, steps/edges, `roleTasks` thô, provider/model/executor/tier/invocation/prefer/overrides/acceptDependence. Chọn base khác thay vì vá base.
  5. **Preflight không từ chối vì họ provider:** dry-bind lại các unit panel đã mở rộng với `{pattern, params}` đầy đủ (wrapper của doctor bỏ `template.params` nên không dùng); ghế chung họ chỉ cảnh báo (`seatsPreflight`), chỉ từ chối khi một vai không có ứng viên nào. Doctor không cần đổi: không thêm mặc định cấu hình, biến môi trường hay file bắt buộc.
  6. **Lưu và resume:** định nghĩa đã mở rộng nằm trong event `workflow.start` hiện có cùng bản ghi nguồn gốc `{seats, baseId, baseDigest, refs}`, projection phơi `seats`; status/resume đọc dữ liệu đã lưu, không mở rộng lại. `workflow resume --seats` khác giá trị đã lưu bị từ chối; không truyền thì giữ như cũ.
- **Ranh giới:** No component-boundary change. Chọn executor/họ vẫn chỉ ở `bind()`; `panel.mjs` không đổi; Workflow component vẫn không biết executor.
- **Giới hạn đã biết:** nội dung `--context-ref` được đọc lúc chạy, không đóng băng. Lens là văn bản do model viết: được chặn bằng độ dài, một dòng, không ngoặc nhọn và câu mẫu cố định, nhưng không biến nội dung tuỳ ý thành an toàn; recipe không cấp quyền. Persona có tên, thư mục `fgos/agents` và pin nội dung persona lúc start chưa làm.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_9a5a4c7c4939080ea71ffaf460d87e7a

Source digest: ede7acc66ef8ba5fd9d75af9ee37f824f703af0fe81bd8a982cad99337ffc068

Target digest: ede7acc66ef8ba5fd9d75af9ee37f824f703af0fe81bd8a982cad99337ffc068

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-322",
  "sourceLines": [
    3209,
    3220
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0056 — `--seats`: chuyên biệt hoá ghế panel bằng lens khi khởi động, không thêm workflow YAML hay registry"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-181",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0056 — `--seats`: chuyên biệt hoá ghế panel bằng lens khi khởi động, không thêm workflow YAML hay registry"
  ],
  "nativeTargetClaimId": "claim_cd4314cdc619a77fcaa0e779f0369bdd",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9a5a4c7c4939080ea71ffaf460d87e7a",
    "sourceUnitDigest": "ede7acc66ef8ba5fd9d75af9ee37f824f703af0fe81bd8a982cad99337ffc068",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-181",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-322 (lines 3209–3220) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-181. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ede7acc66ef8ba5fd9d75af9ee37f824f703af0fe81bd8a982cad99337ffc068",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0056 — `--seats`: chuyên biệt hoá ghế panel bằng lens khi khởi động, không thêm workflow YAML hay registry"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (owner, 2026-10-11), phạm vi giai đoạn 1: lens inline. Persona có tên (`@name`) là giai đoạn sau, hiện bị từ chối rõ ràng.
- **Bối cảnh:** Các base thảo luận có panel chung (3 ghế mặc định không khác nhau) nên một câu hỏi theo miền (tài chính, nhân sự) không chỉ ra được góc nhìn cần có. Thêm một workflow YAML cho mỗi miền là ngôn ngữ workflow thứ hai; một file recipe là carrier mới cho thứ mà một cờ đã chứa được. Số ghế không còn bị chặn bởi số họ provider (decision 0055), nên số lens không cần trần ở schema.
- **Quyết định:**
  1. **Một cờ tuỳ chọn** `fgos workflow start <base> --seats "a|b|c"`, phản chiếu `--stance-options`. Chỉ phân tích cú pháp ở CLI; chuyên biệt hoá thuộc Workflow component (`src/workflow/seats.mjs`), thuần và xác định (không đồng hồ, ngẫu nhiên, model), chạy trong `prepareWorkflowRun` trước khi tạo run nên đầu vào sai không tạo run, không mở pane.
  2. **Đủ điều kiện theo cấu trúc:** unit `panel` mà `roleTasks` không có khoá `panelist-N` và không có `params.role` tuỳ chỉnh. Base có panel được dựng riêng (`council-lite`, `architecture-advisory`) hoặc không có panel chung (`architecture-advisory-reopen`, plan dịch từ plan.md) bị từ chối kèm lý do. Không có danh sách cứng.
  3. **Chỉ đổi trường ghế:** `params.members`, `roleTasks.panelist-1..N` (một câu hằng của runtime, lens là tiêu điểm phân tích, không phải danh tính hay chỉ thị), cộng chép tường minh `--context-ref` dùng chung vào template của mọi unit ở bước có `dependsOn` (vì ref cấp run chỉ tới bước gốc). Topology, gate, `blind`, nhiệm vụ checker, văn bản synthesizer giữ nguyên; revalidate bằng đúng validator. Delphi dùng cùng ánh xạ ghế ở cả hai vòng.
  4. **Cấm trong bề mặt recipe:** số ghế riêng, vòng, blind, gate, critique, chọn synthesizer, steps/edges, `roleTasks` thô, provider/model/executor/tier/invocation/prefer/overrides/acceptDependence. Chọn base khác thay vì vá base.
  5. **Preflight không từ chối vì họ provider:** dry-bind lại các unit panel đã mở rộng với `{pattern, params}` đầy đủ (wrapper của doctor bỏ `template.params` nên không dùng); ghế chung họ chỉ cảnh báo (`seatsPreflight`), chỉ từ chối khi một vai không có ứng viên nào. Doctor không cần đổi: không thêm mặc định cấu hình, biến môi trường hay file bắt buộc.
  6. **Lưu và resume:** định nghĩa đã mở rộng nằm trong event `workflow.start` hiện có cùng bản ghi nguồn gốc `{seats, baseId, baseDigest, refs}`, projection phơi `seats`; status/resume đọc dữ liệu đã lưu, không mở rộng lại. `workflow resume --seats` khác giá trị đã lưu bị từ chối; không truyền thì giữ như cũ.
- **Ranh giới:** No component-boundary change. Chọn executor/họ vẫn chỉ ở `bind()`; `panel.mjs` không đổi; Workflow component vẫn không biết executor.
- **Giới hạn đã biết:** nội dung `--context-ref` được đọc lúc chạy, không đóng băng. Lens là văn bản do model viết: được chặn bằng độ dài, một dòng, không ngoặc nhọn và câu mẫu cố định, nhưng không biến nội dung tuỳ ý thành an toàn; recipe không cấp quyền. Persona có tên, thư mục `fgos/agents` và pin nội dung persona lúc start chưa làm.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (owner, 2026-10-11), phạm vi giai đoạn 1: lens inline. Persona có tên (`@name`) là giai đoạn sau, hiện bị từ chối rõ ràng.
- **Bối cảnh:** Các base thảo luận có panel chung (3 ghế mặc định không khác nhau) nên một câu hỏi theo miền (tài chính, nhân sự) không chỉ ra được góc nhìn cần có. Thêm một workflow YAML cho mỗi miền là ngôn ngữ workflow thứ hai; một file recipe là carrier mới cho thứ mà một cờ đã chứa được. Số ghế không còn bị chặn bởi số họ provider (decision 0055), nên số lens không cần trần ở schema.
- **Quyết định:**
  1. **Một cờ tuỳ chọn** `fgos workflow start <base> --seats "a|b|c"`, phản chiếu `--stance-options`. Chỉ phân tích cú pháp ở CLI; chuyên biệt hoá thuộc Workflow component (`src/workflow/seats.mjs`), thuần và xác định (không đồng hồ, ngẫu nhiên, model), chạy trong `prepareWorkflowRun` trước khi tạo run nên đầu vào sai không tạo run, không mở pane.
  2. **Đủ điều kiện theo cấu trúc:** unit `panel` mà `roleTasks` không có khoá `panelist-N` và không có `params.role` tuỳ chỉnh. Base có panel được dựng riêng (`council-lite`, `architecture-advisory`) hoặc không có panel chung (`architecture-advisory-reopen`, plan dịch từ plan.md) bị từ chối kèm lý do. Không có danh sách cứng.
  3. **Chỉ đổi trường ghế:** `params.members`, `roleTasks.panelist-1..N` (một câu hằng của runtime, lens là tiêu điểm phân tích, không phải danh tính hay chỉ thị), cộng chép tường minh `--context-ref` dùng chung vào template của mọi unit ở bước có `dependsOn` (vì ref cấp run chỉ tới bước gốc). Topology, gate, `blind`, nhiệm vụ checker, văn bản synthesizer giữ nguyên; revalidate bằng đúng validator. Delphi dùng cùng ánh xạ ghế ở cả hai vòng.
  4. **Cấm trong bề mặt recipe:** số ghế riêng, vòng, blind, gate, critique, chọn synthesizer, steps/edges, `roleTasks` thô, provider/model/executor/tier/invocation/prefer/overrides/acceptDependence. Chọn base khác thay vì vá base.
  5. **Preflight không từ chối vì họ provider:** dry-bind lại các unit panel đã mở rộng với `{pattern, params}` đầy đủ (wrapper của doctor bỏ `template.params` nên không dùng); ghế chung họ chỉ cảnh báo (`seatsPreflight`), chỉ từ chối khi một vai không có ứng viên nào. Doctor không cần đổi: không thêm mặc định cấu hình, biến môi trường hay file bắt buộc.
  6. **Lưu và resume:** định nghĩa đã mở rộng nằm trong event `workflow.start` hiện có cùng bản ghi nguồn gốc `{seats, baseId, baseDigest, refs}`, projection phơi `seats`; status/resume đọc dữ liệu đã lưu, không mở rộng lại. `workflow resume --seats` khác giá trị đã lưu bị từ chối; không truyền thì giữ như cũ.
- **Ranh giới:** No component-boundary change. Chọn executor/họ vẫn chỉ ở `bind()`; `panel.mjs` không đổi; Workflow component vẫn không biết executor.
- **Giới hạn đã biết:** nội dung `--context-ref` được đọc lúc chạy, không đóng băng. Lens là văn bản do model viết: được chặn bằng độ dài, một dòng, không ngoặc nhọn và câu mẫu cố định, nhưng không biến nội dung tuỳ ý thành an toàn; recipe không cấp quyền. Persona có tên, thư mục `fgos/agents` và pin nội dung persona lúc start chưa làm.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_17061fbe7eb887241536b870f6d10a12

Source digest: 03e970109c245bd491f286e8b54c799121e32c7300c0dab2e80dcaef1e21564a

Target digest: 03e970109c245bd491f286e8b54c799121e32c7300c0dab2e80dcaef1e21564a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
  "sourceLines": [
    3222,
    3222
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_80eb873b2855eda9a8549ea77cb60166",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_17061fbe7eb887241536b870f6d10a12",
    "sourceUnitDigest": "03e970109c245bd491f286e8b54c799121e32c7300c0dab2e80dcaef1e21564a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế (lines 3222–3222) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "03e970109c245bd491f286e8b54c799121e32c7300c0dab2e80dcaef1e21564a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0057 — `--seats @name`: persona có tên theo ba tầng tra cứu, ghim nội dung lúc start, gắn đúng một ghế

- **Trạng thái:** Settled (owner, 2026-10-11), giai đoạn 2 của 0056. Thực hiện phần "lookup" của RUL13 (customer customization lives in one tracked workspace folder) trong `docs/specs/distribution.md` cho persona.
- **Bối cảnh:** Lens inline (0056) đủ cho góc nhìn tạm; một miền (tài chính, nhân sự) cần tư thế ổn định, có ranh giới quyết định, do khách hàng viết và dùng lại giữa các lần chạy. `renderPersonaSection` chỉ đọc `core/agents` của project đang chạy nên định nghĩa cài đặt không bao giờ tới project khác, và không có chỗ nào cho định nghĩa của khách.
- **Quyết định:**
  1. **Một chỗ tra cứu** `src/runner/agent-definitions.mjs` (infra, cạnh `agent-roster.mjs`): `fgos/agents/<name>.yaml` của project, rồi `domains/*/agents/`, rồi `core/agents/`. Tầng cao thay nguyên file tầng thấp, không trộn trường. Hai file cùng tên trong một tầng là lỗi (resolver và doctor); tên không có là lỗi liệt kê mọi thư mục đã tìm, không có fallback im lặng. Project không có thư mục `domains/` hoặc `core/agents/` riêng thì đọc của package đang chạy (vị trí code, không phải cwd hay PATH). Chỉ nhận `<name>.yaml` (`.yml` được báo là bị bỏ qua), tối đa 16 KiB, phải khai `name:` trùng tên file và `description:` không rỗng.
  2. **Ghế có phạm vi vai.** Workflow runner phát override `{scope:{unit, role:"panelist-N"}, persona, personaPin, origin:"workflow"}` cho mỗi ghế có tên trên mọi unit `panel`, đứng TRƯỚC override persona cả unit; `bind()` không đổi (override khớp đầu tiên thắng, `scope.role` đã được khớp). Synthesizer và checker không khớp scope nên không nhận persona của ghế; ghế lens vẫn nhận persona cả unit.
  3. **Ghim lúc start.** Tên được resolve trong `resolveStart` trước khi tạo run (từ chối tên sai, trùng, hoặc file sai hình dạng mà không tạo run, không mở pane). Nội dung file và SHA-256 nằm trong event `workflow.start` hiện có, `seats.personas`, và projection phơi ra; resume và bước sau chỉ đọc bản ghim.
  4. **Đường vận chuyển chung.** Bản ghim đi qua hợp đồng assignment sẵn có: `run.mjs` chép nó vào `assignment.policy.personaPin` (khớp theo vai và tên), `assignment-runner` đưa vào `options.persona.pinnedText`, `renderPersonaSection` dùng nó thay cho việc đọc file. Cùng một parser và một renderer; không có cơ chế thứ hai, `bind()` không đổi chấm điểm.
  5. **Trộn lens và tên.** `--seats "@a|lens|@b"` giữ thứ tự; ghế tên không có lens task nên giữ objective của unit làm task; `{objective}` trong văn bản persona giữ nguyên chữ (không đi qua mẫu của pattern); cùng một persona hai lần bị từ chối như trùng ghế.
  6. **Doctor.** `agent-type-names-unique` đổi từ "duy nhất toàn cục" sang "duy nhất trong từng tầng" (RUL13 (customer customization lives in one tracked workspace folder) thay quy tắc cũ), thêm tầng `fgos/agents`, báo định nghĩa của khách thay file nào của tầng dưới, kiểm hình dạng và báo file `.yml`. Không thêm mặc định cấu hình, biến môi trường hay file bắt buộc (thư mục `fgos/agents` là tuỳ chọn, chỉ đọc), nên không có đăng ký config-default.
- **Không làm:** trường refs theo ghế, công cụ soạn persona, nội dung persona của miền, handle tri thức cài đặt, đổi chấm điểm của `bind()`, hợp nhất trường giữa các tầng.
- **Tái dùng / thiếu:** tái dùng `parseSimplePersonaYaml` và `renderPersonaSection` (chỉ thêm nguồn văn bản đã ghim), ghép override và `scope.role` của `bind()`, đường `workflow.start` + projection của `seats`, registry doctor, thứ tự ba tầng của khám phá workflow/giao thức. Thiếu trước đó: chính chỗ tra cứu (RUL13 (customer customization lives in one tracked workspace folder) chỉ có văn bản), tầng workspace, ghim.
- **Ranh giới:** No component-boundary change. Tra cứu file định nghĩa là hạ tầng dùng chung của Execution Core (`src/runner`), không phải chính sách của Workflow runner; Workflow component chỉ gọi nó và chọn ghế; chọn executor/họ/tier vẫn chỉ ở `bind()`; pattern vẫn chỉ khai ý định; workflow YAML vẫn không mang persona của ghế.
- **Giới hạn đã biết:** persona tên chỉ dùng được ở ghế panel của base có panel chung. Persona của unit (`persona:` trong template) và persona của capability vẫn đọc `core/agents` của project đang chạy lúc dispatch, chưa qua ba tầng. Nội dung ghim nằm trong event log và projection (tối đa 16 KiB mỗi persona).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0057 — `--seats @name`: persona có tên theo ba tầng tra cứu, ghim nội dung lúc start, gắn đúng một ghế

- **Trạng thái:** Settled (owner, 2026-10-11), giai đoạn 2 của 0056. Thực hiện phần "lookup" của RUL13 (customer customization lives in one tracked workspace folder) trong `docs/specs/distribution.md` cho persona.
- **Bối cảnh:** Lens inline (0056) đủ cho góc nhìn tạm; một miền (tài chính, nhân sự) cần tư thế ổn định, có ranh giới quyết định, do khách hàng viết và dùng lại giữa các lần chạy. `renderPersonaSection` chỉ đọc `core/agents` của project đang chạy nên định nghĩa cài đặt không bao giờ tới project khác, và không có chỗ nào cho định nghĩa của khách.
- **Quyết định:**
  1. **Một chỗ tra cứu** `src/runner/agent-definitions.mjs` (infra, cạnh `agent-roster.mjs`): `fgos/agents/<name>.yaml` của project, rồi `domains/*/agents/`, rồi `core/agents/`. Tầng cao thay nguyên file tầng thấp, không trộn trường. Hai file cùng tên trong một tầng là lỗi (resolver và doctor); tên không có là lỗi liệt kê mọi thư mục đã tìm, không có fallback im lặng. Project không có thư mục `domains/` hoặc `core/agents/` riêng thì đọc của package đang chạy (vị trí code, không phải cwd hay PATH). Chỉ nhận `<name>.yaml` (`.yml` được báo là bị bỏ qua), tối đa 16 KiB, phải khai `name:` trùng tên file và `description:` không rỗng.
  2. **Ghế có phạm vi vai.** Workflow runner phát override `{scope:{unit, role:"panelist-N"}, persona, personaPin, origin:"workflow"}` cho mỗi ghế có tên trên mọi unit `panel`, đứng TRƯỚC override persona cả unit; `bind()` không đổi (override khớp đầu tiên thắng, `scope.role` đã được khớp). Synthesizer và checker không khớp scope nên không nhận persona của ghế; ghế lens vẫn nhận persona cả unit.
  3. **Ghim lúc start.** Tên được resolve trong `resolveStart` trước khi tạo run (từ chối tên sai, trùng, hoặc file sai hình dạng mà không tạo run, không mở pane). Nội dung file và SHA-256 nằm trong event `workflow.start` hiện có, `seats.personas`, và projection phơi ra; resume và bước sau chỉ đọc bản ghim.
  4. **Đường vận chuyển chung.** Bản ghim đi qua hợp đồng assignment sẵn có: `run.mjs` chép nó vào `assignment.policy.personaPin` (khớp theo vai và tên), `assignment-runner` đưa vào `options.persona.pinnedText`, `renderPersonaSection` dùng nó thay cho việc đọc file. Cùng một parser và một renderer; không có cơ chế thứ hai, `bind()` không đổi chấm điểm.
  5. **Trộn lens và tên.** `--seats "@a|lens|@b"` giữ thứ tự; ghế tên không có lens task nên giữ objective của unit làm task; `{objective}` trong văn bản persona giữ nguyên chữ (không đi qua mẫu của pattern); cùng một persona hai lần bị từ chối như trùng ghế.
  6. **Doctor.** `agent-type-names-unique` đổi từ "duy nhất toàn cục" sang "duy nhất trong từng tầng" (RUL13 (customer customization lives in one tracked workspace folder) thay quy tắc cũ), thêm tầng `fgos/agents`, báo định nghĩa của khách thay file nào của tầng dưới, kiểm hình dạng và báo file `.yml`. Không thêm mặc định cấu hình, biến môi trường hay file bắt buộc (thư mục `fgos/agents` là tuỳ chọn, chỉ đọc), nên không có đăng ký config-default.
- **Không làm:** trường refs theo ghế, công cụ soạn persona, nội dung persona của miền, handle tri thức cài đặt, đổi chấm điểm của `bind()`, hợp nhất trường giữa các tầng.
- **Tái dùng / thiếu:** tái dùng `parseSimplePersonaYaml` và `renderPersonaSection` (chỉ thêm nguồn văn bản đã ghim), ghép override và `scope.role` của `bind()`, đường `workflow.start` + projection của `seats`, registry doctor, thứ tự ba tầng của khám phá workflow/giao thức. Thiếu trước đó: chính chỗ tra cứu (RUL13 (customer customization lives in one tracked workspace folder) chỉ có văn bản), tầng workspace, ghim.
- **Ranh giới:** No component-boundary change. Tra cứu file định nghĩa là hạ tầng dùng chung của Execution Core (`src/runner`), không phải chính sách của Workflow runner; Workflow component chỉ gọi nó và chọn ghế; chọn executor/họ/tier vẫn chỉ ở `bind()`; pattern vẫn chỉ khai ý định; workflow YAML vẫn không mang persona của ghế.
- **Giới hạn đã biết:** persona tên chỉ dùng được ở ghế panel của base có panel chung. Persona của unit (`persona:` trong template) và persona của capability vẫn đọc `core/agents` của project đang chạy lúc dispatch, chưa qua ba tầng. Nội dung ghim nằm trong event log và projection (tối đa 16 KiB mỗi persona).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_89cb129252c64e683e06902d3a1e2516

Source digest: d1f0faef5ca3de2ede25d801bf20fe9505d25e86b186aee4ee1f096bde63fc2e

Target digest: d1f0faef5ca3de2ede25d801bf20fe9505d25e86b186aee4ee1f096bde63fc2e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-323",
  "sourceLines": [
    3224,
    3237
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0057 — `--seats @name`: persona có tên theo ba tầng tra cứu, ghim nội dung lúc start, gắn đúng một ghế"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-182",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0057 — `--seats @name`: persona có tên theo ba tầng tra cứu, ghim nội dung lúc start, gắn đúng một ghế"
  ],
  "nativeTargetClaimId": "claim_04c25e7590538065e91a06767a20e9ec",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_89cb129252c64e683e06902d3a1e2516",
    "sourceUnitDigest": "d1f0faef5ca3de2ede25d801bf20fe9505d25e86b186aee4ee1f096bde63fc2e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-182",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-323 (lines 3224–3237) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-182. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d1f0faef5ca3de2ede25d801bf20fe9505d25e86b186aee4ee1f096bde63fc2e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0057 — `--seats @name`: persona có tên theo ba tầng tra cứu, ghim nội dung lúc start, gắn đúng một ghế"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (owner, 2026-10-11), giai đoạn 2 của 0056. Thực hiện phần "lookup" của RUL13 (customer customization lives in one tracked workspace folder) trong `docs/specs/distribution.md` cho persona.
- **Bối cảnh:** Lens inline (0056) đủ cho góc nhìn tạm; một miền (tài chính, nhân sự) cần tư thế ổn định, có ranh giới quyết định, do khách hàng viết và dùng lại giữa các lần chạy. `renderPersonaSection` chỉ đọc `core/agents` của project đang chạy nên định nghĩa cài đặt không bao giờ tới project khác, và không có chỗ nào cho định nghĩa của khách.
- **Quyết định:**
  1. **Một chỗ tra cứu** `src/runner/agent-definitions.mjs` (infra, cạnh `agent-roster.mjs`): `fgos/agents/<name>.yaml` của project, rồi `domains/*/agents/`, rồi `core/agents/`. Tầng cao thay nguyên file tầng thấp, không trộn trường. Hai file cùng tên trong một tầng là lỗi (resolver và doctor); tên không có là lỗi liệt kê mọi thư mục đã tìm, không có fallback im lặng. Project không có thư mục `domains/` hoặc `core/agents/` riêng thì đọc của package đang chạy (vị trí code, không phải cwd hay PATH). Chỉ nhận `<name>.yaml` (`.yml` được báo là bị bỏ qua), tối đa 16 KiB, phải khai `name:` trùng tên file và `description:` không rỗng.
  2. **Ghế có phạm vi vai.** Workflow runner phát override `{scope:{unit, role:"panelist-N"}, persona, personaPin, origin:"workflow"}` cho mỗi ghế có tên trên mọi unit `panel`, đứng TRƯỚC override persona cả unit; `bind()` không đổi (override khớp đầu tiên thắng, `scope.role` đã được khớp). Synthesizer và checker không khớp scope nên không nhận persona của ghế; ghế lens vẫn nhận persona cả unit.
  3. **Ghim lúc start.** Tên được resolve trong `resolveStart` trước khi tạo run (từ chối tên sai, trùng, hoặc file sai hình dạng mà không tạo run, không mở pane). Nội dung file và SHA-256 nằm trong event `workflow.start` hiện có, `seats.personas`, và projection phơi ra; resume và bước sau chỉ đọc bản ghim.
  4. **Đường vận chuyển chung.** Bản ghim đi qua hợp đồng assignment sẵn có: `run.mjs` chép nó vào `assignment.policy.personaPin` (khớp theo vai và tên), `assignment-runner` đưa vào `options.persona.pinnedText`, `renderPersonaSection` dùng nó thay cho việc đọc file. Cùng một parser và một renderer; không có cơ chế thứ hai, `bind()` không đổi chấm điểm.
  5. **Trộn lens và tên.** `--seats "@a|lens|@b"` giữ thứ tự; ghế tên không có lens task nên giữ objective của unit làm task; `{objective}` trong văn bản persona giữ nguyên chữ (không đi qua mẫu của pattern); cùng một persona hai lần bị từ chối như trùng ghế.
  6. **Doctor.** `agent-type-names-unique` đổi từ "duy nhất toàn cục" sang "duy nhất trong từng tầng" (RUL13 (customer customization lives in one tracked workspace folder) thay quy tắc cũ), thêm tầng `fgos/agents`, báo định nghĩa của khách thay file nào của tầng dưới, kiểm hình dạng và báo file `.yml`. Không thêm mặc định cấu hình, biến môi trường hay file bắt buộc (thư mục `fgos/agents` là tuỳ chọn, chỉ đọc), nên không có đăng ký config-default.
- **Không làm:** trường refs theo ghế, công cụ soạn persona, nội dung persona của miền, handle tri thức cài đặt, đổi chấm điểm của `bind()`, hợp nhất trường giữa các tầng.
- **Tái dùng / thiếu:** tái dùng `parseSimplePersonaYaml` và `renderPersonaSection` (chỉ thêm nguồn văn bản đã ghim), ghép override và `scope.role` của `bind()`, đường `workflow.start` + projection của `seats`, registry doctor, thứ tự ba tầng của khám phá workflow/giao thức. Thiếu trước đó: chính chỗ tra cứu (RUL13 (customer customization lives in one tracked workspace folder) chỉ có văn bản), tầng workspace, ghim.
- **Ranh giới:** No component-boundary change. Tra cứu file định nghĩa là hạ tầng dùng chung của Execution Core (`src/runner`), không phải chính sách của Workflow runner; Workflow component chỉ gọi nó và chọn ghế; chọn executor/họ/tier vẫn chỉ ở `bind()`; pattern vẫn chỉ khai ý định; workflow YAML vẫn không mang persona của ghế.
- **Giới hạn đã biết:** persona tên chỉ dùng được ở ghế panel của base có panel chung. Persona của unit (`persona:` trong template) và persona của capability vẫn đọc `core/agents` của project đang chạy lúc dispatch, chưa qua ba tầng. Nội dung ghim nằm trong event log và projection (tối đa 16 KiB mỗi persona).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (owner, 2026-10-11), giai đoạn 2 của 0056. Thực hiện phần "lookup" của RUL13 (customer customization lives in one tracked workspace folder) trong `docs/specs/distribution.md` cho persona.
- **Bối cảnh:** Lens inline (0056) đủ cho góc nhìn tạm; một miền (tài chính, nhân sự) cần tư thế ổn định, có ranh giới quyết định, do khách hàng viết và dùng lại giữa các lần chạy. `renderPersonaSection` chỉ đọc `core/agents` của project đang chạy nên định nghĩa cài đặt không bao giờ tới project khác, và không có chỗ nào cho định nghĩa của khách.
- **Quyết định:**
  1. **Một chỗ tra cứu** `src/runner/agent-definitions.mjs` (infra, cạnh `agent-roster.mjs`): `fgos/agents/<name>.yaml` của project, rồi `domains/*/agents/`, rồi `core/agents/`. Tầng cao thay nguyên file tầng thấp, không trộn trường. Hai file cùng tên trong một tầng là lỗi (resolver và doctor); tên không có là lỗi liệt kê mọi thư mục đã tìm, không có fallback im lặng. Project không có thư mục `domains/` hoặc `core/agents/` riêng thì đọc của package đang chạy (vị trí code, không phải cwd hay PATH). Chỉ nhận `<name>.yaml` (`.yml` được báo là bị bỏ qua), tối đa 16 KiB, phải khai `name:` trùng tên file và `description:` không rỗng.
  2. **Ghế có phạm vi vai.** Workflow runner phát override `{scope:{unit, role:"panelist-N"}, persona, personaPin, origin:"workflow"}` cho mỗi ghế có tên trên mọi unit `panel`, đứng TRƯỚC override persona cả unit; `bind()` không đổi (override khớp đầu tiên thắng, `scope.role` đã được khớp). Synthesizer và checker không khớp scope nên không nhận persona của ghế; ghế lens vẫn nhận persona cả unit.
  3. **Ghim lúc start.** Tên được resolve trong `resolveStart` trước khi tạo run (từ chối tên sai, trùng, hoặc file sai hình dạng mà không tạo run, không mở pane). Nội dung file và SHA-256 nằm trong event `workflow.start` hiện có, `seats.personas`, và projection phơi ra; resume và bước sau chỉ đọc bản ghim.
  4. **Đường vận chuyển chung.** Bản ghim đi qua hợp đồng assignment sẵn có: `run.mjs` chép nó vào `assignment.policy.personaPin` (khớp theo vai và tên), `assignment-runner` đưa vào `options.persona.pinnedText`, `renderPersonaSection` dùng nó thay cho việc đọc file. Cùng một parser và một renderer; không có cơ chế thứ hai, `bind()` không đổi chấm điểm.
  5. **Trộn lens và tên.** `--seats "@a|lens|@b"` giữ thứ tự; ghế tên không có lens task nên giữ objective của unit làm task; `{objective}` trong văn bản persona giữ nguyên chữ (không đi qua mẫu của pattern); cùng một persona hai lần bị từ chối như trùng ghế.
  6. **Doctor.** `agent-type-names-unique` đổi từ "duy nhất toàn cục" sang "duy nhất trong từng tầng" (RUL13 (customer customization lives in one tracked workspace folder) thay quy tắc cũ), thêm tầng `fgos/agents`, báo định nghĩa của khách thay file nào của tầng dưới, kiểm hình dạng và báo file `.yml`. Không thêm mặc định cấu hình, biến môi trường hay file bắt buộc (thư mục `fgos/agents` là tuỳ chọn, chỉ đọc), nên không có đăng ký config-default.
- **Không làm:** trường refs theo ghế, công cụ soạn persona, nội dung persona của miền, handle tri thức cài đặt, đổi chấm điểm của `bind()`, hợp nhất trường giữa các tầng.
- **Tái dùng / thiếu:** tái dùng `parseSimplePersonaYaml` và `renderPersonaSection` (chỉ thêm nguồn văn bản đã ghim), ghép override và `scope.role` của `bind()`, đường `workflow.start` + projection của `seats`, registry doctor, thứ tự ba tầng của khám phá workflow/giao thức. Thiếu trước đó: chính chỗ tra cứu (RUL13 (customer customization lives in one tracked workspace folder) chỉ có văn bản), tầng workspace, ghim.
- **Ranh giới:** No component-boundary change. Tra cứu file định nghĩa là hạ tầng dùng chung của Execution Core (`src/runner`), không phải chính sách của Workflow runner; Workflow component chỉ gọi nó và chọn ghế; chọn executor/họ/tier vẫn chỉ ở `bind()`; pattern vẫn chỉ khai ý định; workflow YAML vẫn không mang persona của ghế.
- **Giới hạn đã biết:** persona tên chỉ dùng được ở ghế panel của base có panel chung. Persona của unit (`persona:` trong template) và persona của capability vẫn đọc `core/agents` của project đang chạy lúc dispatch, chưa qua ba tầng. Nội dung ghim nằm trong event log và projection (tối đa 16 KiB mỗi persona).
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_fd4f7bc3b9f656db315c5f1320b8dab4

Source digest: 403486a0de69580ccf79203888df2f75637b3acea53ce3624dbfc1944a63e1a0

Target digest: 403486a0de69580ccf79203888df2f75637b3acea53ce3624dbfc1944a63e1a0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
  "sourceLines": [
    3239,
    3239
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_9e3b7d166565c442862aa903b7095d79",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fd4f7bc3b9f656db315c5f1320b8dab4",
    "sourceUnitDigest": "403486a0de69580ccf79203888df2f75637b3acea53ce3624dbfc1944a63e1a0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate (lines 3239–3239) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "403486a0de69580ccf79203888df2f75637b3acea53ce3624dbfc1944a63e1a0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0058 — Provider failure fails over inside Execution Core: another account of the same provider first, then the next candidate

- **Status:** Settled (owner, 2026-10-11). Extends item 3 of 0050 ("a `provider-limit` only walks to the next candidate") and the soft family spread of 0055.
- **Context:** A synthesizer bound to `deepseek` (pi, provider openrouter) exited with code 1 and stderr `No API key found for openrouter.`. The run settled as `nonzero-process-exit` with outcome `execution-failure`, so no fallback ran and the whole unit failed although other accounts and other providers could serve it. Dry-bind (preflight) cannot know whether a login works, and a credential probe at preflight would be a second mechanism that goes stale; the runtime is where a dead login becomes visible.
- **Decision:**
  1. **Classify the exit.** A non-zero, non-timeout exit with no valid worker claim whose last five stderr lines hold a dead-credential wording from the shared `AUTH_FAILURE_PATTERNS` (now including the anchored `No API key found for <provider>`) settles as `provider-limit` with `failure.cause: credential`. The capacity classifier then quarantines the leased account as `auth-token` (`manual-clear`), exactly as for the pane wordings. The pane liveness ladder reads the same list line by line, so a line that only quotes the wording inside other text does not match.
  2. **Rotate the account first.** When a round ends `provider-limit`, `run.mjs` asks `account-rotation.mjs` whether the executor's provider (the lease's own provider bucket) still has a usable account: listed in the inventory, not quarantined (read through `inspectProviderCapacity`, no second ranking). If so, and fewer retries than the provider has accounts were spent on this candidate, the same binding runs again as attempt `-fb<n>` (`retrySameCandidate`), and the lease ranks the next account. A provider with one account, no inventory, or nothing left skips straight to step 3. The budget is derived from the recorded attempts, so a resumed run does not reset it.
  3. **Then another provider.** `nextCandidate` walks the capability pool as before, with two additions made in `bind()`, the single authority: a small `excludeFamilies` argument (families whose login failed in this unit and that a seat walked away from; rebuilt from the recorded attempts by `credentialFaultFamilies`), and the sibling-seat spread read again at walk time, so a seat that falls back still prefers a family its siblings did not use. Spread never refuses; an exclusion can, and then the walk ends as `fallbackExhausted`.
  4. **A seat fails only when both are used up.** The seat keeps its role through the retries, the role ledger records every executor it ran, `unit-summary` lists each attempt and derives `sharedFamilies` from the final binding as before. An exhausted seat returns `provider-limit` with `fallbackExhausted` (plus `accountRotations` when any retry ran).
  5. **Provenance (additive).** `fallbackFrom.kind` is `account-rotation` (with `provider`, `accountsHealthy`) or `next-candidate`; each attempt in `unit.json` may carry `failureCause: credential`; `unit-summary.read.v2` documents the optional keys without a version change. Both rotation and walk attempts count as fallback attempts in metrics.
  6. **Write gate.** The mutating-assignment gate recomputes `bind()` from the recorded attempt chain. A rotation retry now resumes the walk where the attempt it retries did, and the gate applies the same family exclusion (only walks made no later than the attempt's own `boundAt`), so a writing seat passes the gate on a retry or a walk instead of being refused with a binding mismatch.
- **Reused / changed:** reused the account inventory, lease ranking, quarantine and fault classifier (`provider-capacity.mjs`), `nextCandidate`, the `-fb<n>` assignment ids and `skipCandidateIndex` chain, `role-ledger.mjs`, and `AUTH_FAILURE_PATTERNS`. Added `account-rotation.mjs`, `retrySameCandidate`, `excludeFamilies`, the settlement mapping of a credential exit, and `runUnit` forwarding `providerCapacityRuntimeDir` to the dispatch it already makes. No recipe, workflow or pattern field, no retry-count knob, no credential probe, no change to `bind()` scoring.
- **Boundary:** No component-boundary change. Account and executor choice stay in Execution Core (`bind()`, `run.mjs`, the lease); patterns and workflows still declare intent only and never name executors, providers or accounts.
- **Known limits / follow-ups:** the write gate still recomputes `bind()` without `preferIndependentOf` (open since 0055), so a writing synthesizer that falls back by spread preference can still be refused there; this change does not make that case worse. A dead login with no account inventory for its provider has nothing to rotate or quarantine: the seat walks to the next candidate each time it is bound and is only protected within one unit. Preflight stays blind to credentials by design; failover is the runtime answer to what dry-bind cannot see.
Superseding this decision needs a new record; do not edit it in place.
```

### Full target unit

```text
### 0058 — Provider failure fails over inside Execution Core: another account of the same provider first, then the next candidate

- **Status:** Settled (owner, 2026-10-11). Extends item 3 of 0050 ("a `provider-limit` only walks to the next candidate") and the soft family spread of 0055.
- **Context:** A synthesizer bound to `deepseek` (pi, provider openrouter) exited with code 1 and stderr `No API key found for openrouter.`. The run settled as `nonzero-process-exit` with outcome `execution-failure`, so no fallback ran and the whole unit failed although other accounts and other providers could serve it. Dry-bind (preflight) cannot know whether a login works, and a credential probe at preflight would be a second mechanism that goes stale; the runtime is where a dead login becomes visible.
- **Decision:**
  1. **Classify the exit.** A non-zero, non-timeout exit with no valid worker claim whose last five stderr lines hold a dead-credential wording from the shared `AUTH_FAILURE_PATTERNS` (now including the anchored `No API key found for <provider>`) settles as `provider-limit` with `failure.cause: credential`. The capacity classifier then quarantines the leased account as `auth-token` (`manual-clear`), exactly as for the pane wordings. The pane liveness ladder reads the same list line by line, so a line that only quotes the wording inside other text does not match.
  2. **Rotate the account first.** When a round ends `provider-limit`, `run.mjs` asks `account-rotation.mjs` whether the executor's provider (the lease's own provider bucket) still has a usable account: listed in the inventory, not quarantined (read through `inspectProviderCapacity`, no second ranking). If so, and fewer retries than the provider has accounts were spent on this candidate, the same binding runs again as attempt `-fb<n>` (`retrySameCandidate`), and the lease ranks the next account. A provider with one account, no inventory, or nothing left skips straight to step 3. The budget is derived from the recorded attempts, so a resumed run does not reset it.
  3. **Then another provider.** `nextCandidate` walks the capability pool as before, with two additions made in `bind()`, the single authority: a small `excludeFamilies` argument (families whose login failed in this unit and that a seat walked away from; rebuilt from the recorded attempts by `credentialFaultFamilies`), and the sibling-seat spread read again at walk time, so a seat that falls back still prefers a family its siblings did not use. Spread never refuses; an exclusion can, and then the walk ends as `fallbackExhausted`.
  4. **A seat fails only when both are used up.** The seat keeps its role through the retries, the role ledger records every executor it ran, `unit-summary` lists each attempt and derives `sharedFamilies` from the final binding as before. An exhausted seat returns `provider-limit` with `fallbackExhausted` (plus `accountRotations` when any retry ran).
  5. **Provenance (additive).** `fallbackFrom.kind` is `account-rotation` (with `provider`, `accountsHealthy`) or `next-candidate`; each attempt in `unit.json` may carry `failureCause: credential`; `unit-summary.read.v2` documents the optional keys without a version change. Both rotation and walk attempts count as fallback attempts in metrics.
  6. **Write gate.** The mutating-assignment gate recomputes `bind()` from the recorded attempt chain. A rotation retry now resumes the walk where the attempt it retries did, and the gate applies the same family exclusion (only walks made no later than the attempt's own `boundAt`), so a writing seat passes the gate on a retry or a walk instead of being refused with a binding mismatch.
- **Reused / changed:** reused the account inventory, lease ranking, quarantine and fault classifier (`provider-capacity.mjs`), `nextCandidate`, the `-fb<n>` assignment ids and `skipCandidateIndex` chain, `role-ledger.mjs`, and `AUTH_FAILURE_PATTERNS`. Added `account-rotation.mjs`, `retrySameCandidate`, `excludeFamilies`, the settlement mapping of a credential exit, and `runUnit` forwarding `providerCapacityRuntimeDir` to the dispatch it already makes. No recipe, workflow or pattern field, no retry-count knob, no credential probe, no change to `bind()` scoring.
- **Boundary:** No component-boundary change. Account and executor choice stay in Execution Core (`bind()`, `run.mjs`, the lease); patterns and workflows still declare intent only and never name executors, providers or accounts.
- **Known limits / follow-ups:** the write gate still recomputes `bind()` without `preferIndependentOf` (open since 0055), so a writing synthesizer that falls back by spread preference can still be refused there; this change does not make that case worse. A dead login with no account inventory for its provider has nothing to rotate or quarantine: the seat walks to the next candidate each time it is bound and is only protected within one unit. Preflight stays blind to credentials by design; failover is the runtime answer to what dry-bind cannot see.
Superseding this decision needs a new record; do not edit it in place.
```

### Full diff

```diff
No text difference.
```

## claim_2cc4d2b5012fb6dd687f1c357d95a466

Source digest: a51fdcfe7d7914c5336d3e233a6d0242cae8670f7e656299b43ba0f9e3d5de2d

Target digest: a51fdcfe7d7914c5336d3e233a6d0242cae8670f7e656299b43ba0f9e3d5de2d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-324",
  "sourceLines": [
    3241,
    3253
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0058 — Provider failure fails over inside Execution Core: another account of the same provider first, then the next candidate"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-183",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0058 — Provider failure fails over inside Execution Core: another account of the same provider first, then the next candidate"
  ],
  "nativeTargetClaimId": "claim_87baa89517e00f82cc29fc965edebedd",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2cc4d2b5012fb6dd687f1c357d95a466",
    "sourceUnitDigest": "a51fdcfe7d7914c5336d3e233a6d0242cae8670f7e656299b43ba0f9e3d5de2d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-183",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-324 (lines 3241–3253) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-183. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a51fdcfe7d7914c5336d3e233a6d0242cae8670f7e656299b43ba0f9e3d5de2d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0058 — Provider failure fails over inside Execution Core: another account of the same provider first, then the next candidate"
    ]
  }
}
```

### Full source unit

```text
- **Status:** Settled (owner, 2026-10-11). Extends item 3 of 0050 ("a `provider-limit` only walks to the next candidate") and the soft family spread of 0055.
- **Context:** A synthesizer bound to `deepseek` (pi, provider openrouter) exited with code 1 and stderr `No API key found for openrouter.`. The run settled as `nonzero-process-exit` with outcome `execution-failure`, so no fallback ran and the whole unit failed although other accounts and other providers could serve it. Dry-bind (preflight) cannot know whether a login works, and a credential probe at preflight would be a second mechanism that goes stale; the runtime is where a dead login becomes visible.
- **Decision:**
  1. **Classify the exit.** A non-zero, non-timeout exit with no valid worker claim whose last five stderr lines hold a dead-credential wording from the shared `AUTH_FAILURE_PATTERNS` (now including the anchored `No API key found for <provider>`) settles as `provider-limit` with `failure.cause: credential`. The capacity classifier then quarantines the leased account as `auth-token` (`manual-clear`), exactly as for the pane wordings. The pane liveness ladder reads the same list line by line, so a line that only quotes the wording inside other text does not match.
  2. **Rotate the account first.** When a round ends `provider-limit`, `run.mjs` asks `account-rotation.mjs` whether the executor's provider (the lease's own provider bucket) still has a usable account: listed in the inventory, not quarantined (read through `inspectProviderCapacity`, no second ranking). If so, and fewer retries than the provider has accounts were spent on this candidate, the same binding runs again as attempt `-fb<n>` (`retrySameCandidate`), and the lease ranks the next account. A provider with one account, no inventory, or nothing left skips straight to step 3. The budget is derived from the recorded attempts, so a resumed run does not reset it.
  3. **Then another provider.** `nextCandidate` walks the capability pool as before, with two additions made in `bind()`, the single authority: a small `excludeFamilies` argument (families whose login failed in this unit and that a seat walked away from; rebuilt from the recorded attempts by `credentialFaultFamilies`), and the sibling-seat spread read again at walk time, so a seat that falls back still prefers a family its siblings did not use. Spread never refuses; an exclusion can, and then the walk ends as `fallbackExhausted`.
  4. **A seat fails only when both are used up.** The seat keeps its role through the retries, the role ledger records every executor it ran, `unit-summary` lists each attempt and derives `sharedFamilies` from the final binding as before. An exhausted seat returns `provider-limit` with `fallbackExhausted` (plus `accountRotations` when any retry ran).
  5. **Provenance (additive).** `fallbackFrom.kind` is `account-rotation` (with `provider`, `accountsHealthy`) or `next-candidate`; each attempt in `unit.json` may carry `failureCause: credential`; `unit-summary.read.v2` documents the optional keys without a version change. Both rotation and walk attempts count as fallback attempts in metrics.
  6. **Write gate.** The mutating-assignment gate recomputes `bind()` from the recorded attempt chain. A rotation retry now resumes the walk where the attempt it retries did, and the gate applies the same family exclusion (only walks made no later than the attempt's own `boundAt`), so a writing seat passes the gate on a retry or a walk instead of being refused with a binding mismatch.
- **Reused / changed:** reused the account inventory, lease ranking, quarantine and fault classifier (`provider-capacity.mjs`), `nextCandidate`, the `-fb<n>` assignment ids and `skipCandidateIndex` chain, `role-ledger.mjs`, and `AUTH_FAILURE_PATTERNS`. Added `account-rotation.mjs`, `retrySameCandidate`, `excludeFamilies`, the settlement mapping of a credential exit, and `runUnit` forwarding `providerCapacityRuntimeDir` to the dispatch it already makes. No recipe, workflow or pattern field, no retry-count knob, no credential probe, no change to `bind()` scoring.
- **Boundary:** No component-boundary change. Account and executor choice stay in Execution Core (`bind()`, `run.mjs`, the lease); patterns and workflows still declare intent only and never name executors, providers or accounts.
- **Known limits / follow-ups:** the write gate still recomputes `bind()` without `preferIndependentOf` (open since 0055), so a writing synthesizer that falls back by spread preference can still be refused there; this change does not make that case worse. A dead login with no account inventory for its provider has nothing to rotate or quarantine: the seat walks to the next candidate each time it is bound and is only protected within one unit. Preflight stays blind to credentials by design; failover is the runtime answer to what dry-bind cannot see.
Superseding this decision needs a new record; do not edit it in place.
```

### Full target unit

```text
- **Status:** Settled (owner, 2026-10-11). Extends item 3 of 0050 ("a `provider-limit` only walks to the next candidate") and the soft family spread of 0055.
- **Context:** A synthesizer bound to `deepseek` (pi, provider openrouter) exited with code 1 and stderr `No API key found for openrouter.`. The run settled as `nonzero-process-exit` with outcome `execution-failure`, so no fallback ran and the whole unit failed although other accounts and other providers could serve it. Dry-bind (preflight) cannot know whether a login works, and a credential probe at preflight would be a second mechanism that goes stale; the runtime is where a dead login becomes visible.
- **Decision:**
  1. **Classify the exit.** A non-zero, non-timeout exit with no valid worker claim whose last five stderr lines hold a dead-credential wording from the shared `AUTH_FAILURE_PATTERNS` (now including the anchored `No API key found for <provider>`) settles as `provider-limit` with `failure.cause: credential`. The capacity classifier then quarantines the leased account as `auth-token` (`manual-clear`), exactly as for the pane wordings. The pane liveness ladder reads the same list line by line, so a line that only quotes the wording inside other text does not match.
  2. **Rotate the account first.** When a round ends `provider-limit`, `run.mjs` asks `account-rotation.mjs` whether the executor's provider (the lease's own provider bucket) still has a usable account: listed in the inventory, not quarantined (read through `inspectProviderCapacity`, no second ranking). If so, and fewer retries than the provider has accounts were spent on this candidate, the same binding runs again as attempt `-fb<n>` (`retrySameCandidate`), and the lease ranks the next account. A provider with one account, no inventory, or nothing left skips straight to step 3. The budget is derived from the recorded attempts, so a resumed run does not reset it.
  3. **Then another provider.** `nextCandidate` walks the capability pool as before, with two additions made in `bind()`, the single authority: a small `excludeFamilies` argument (families whose login failed in this unit and that a seat walked away from; rebuilt from the recorded attempts by `credentialFaultFamilies`), and the sibling-seat spread read again at walk time, so a seat that falls back still prefers a family its siblings did not use. Spread never refuses; an exclusion can, and then the walk ends as `fallbackExhausted`.
  4. **A seat fails only when both are used up.** The seat keeps its role through the retries, the role ledger records every executor it ran, `unit-summary` lists each attempt and derives `sharedFamilies` from the final binding as before. An exhausted seat returns `provider-limit` with `fallbackExhausted` (plus `accountRotations` when any retry ran).
  5. **Provenance (additive).** `fallbackFrom.kind` is `account-rotation` (with `provider`, `accountsHealthy`) or `next-candidate`; each attempt in `unit.json` may carry `failureCause: credential`; `unit-summary.read.v2` documents the optional keys without a version change. Both rotation and walk attempts count as fallback attempts in metrics.
  6. **Write gate.** The mutating-assignment gate recomputes `bind()` from the recorded attempt chain. A rotation retry now resumes the walk where the attempt it retries did, and the gate applies the same family exclusion (only walks made no later than the attempt's own `boundAt`), so a writing seat passes the gate on a retry or a walk instead of being refused with a binding mismatch.
- **Reused / changed:** reused the account inventory, lease ranking, quarantine and fault classifier (`provider-capacity.mjs`), `nextCandidate`, the `-fb<n>` assignment ids and `skipCandidateIndex` chain, `role-ledger.mjs`, and `AUTH_FAILURE_PATTERNS`. Added `account-rotation.mjs`, `retrySameCandidate`, `excludeFamilies`, the settlement mapping of a credential exit, and `runUnit` forwarding `providerCapacityRuntimeDir` to the dispatch it already makes. No recipe, workflow or pattern field, no retry-count knob, no credential probe, no change to `bind()` scoring.
- **Boundary:** No component-boundary change. Account and executor choice stay in Execution Core (`bind()`, `run.mjs`, the lease); patterns and workflows still declare intent only and never name executors, providers or accounts.
- **Known limits / follow-ups:** the write gate still recomputes `bind()` without `preferIndependentOf` (open since 0055), so a writing synthesizer that falls back by spread preference can still be refused there; this change does not make that case worse. A dead login with no account inventory for its provider has nothing to rotate or quarantine: the seat walks to the next candidate each time it is bound and is only protected within one unit. Preflight stays blind to credentials by design; failover is the runtime answer to what dry-bind cannot see.
Superseding this decision needs a new record; do not edit it in place.
```

### Full diff

```diff
No text difference.
```

## claim_5279f84afaf9f09dd512101da18905c5

Source digest: a4ba52db8acdfc49d4b74f87e9f88961d2fa1b824ffb0d42846dd19332527a08

Target digest: a4ba52db8acdfc49d4b74f87e9f88961d2fa1b824ffb0d42846dd19332527a08

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
  "sourceLines": [
    3255,
    3255
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_e56dc7831f33d28fee57103b98c26148",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5279f84afaf9f09dd512101da18905c5",
    "sourceUnitDigest": "a4ba52db8acdfc49d4b74f87e9f88961d2fa1b824ffb0d42846dd19332527a08",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read (lines 3255–3255) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a4ba52db8acdfc49d4b74f87e9f88961d2fa1b824ffb0d42846dd19332527a08",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0059 — A domain persona pack is a folder; what a seat can name, what it pinned and who ran it are each stated by one read

- **Status:** Settled (owner, 2026-10-12). Builds on 0057 (named persona seats) and 0058 (provider failover).
- **Context:** A domain pack (the first is the go-to-market personas in `domains/marketing/agents/`) must be extendable by a person or company without a manifest, and `fgos-advise` must find its personas without a hardcoded list. Three gaps remained after 0057: an installed persona could not be listed from a consumer project, a project's own `domains/` folder hides every shipped domain persona it lacks without any message, and the persona renderer reads only `description`, `persona.voice|style|archetype` and `decision_boundary.can_decide|must_escalate` and drops anything else silently. A seat also reads its context documents live, so the run could not say what it had been given, and a failover could send the persona and documents to a provider nobody named.
- **Decision:**
  1. **A pack is a folder, no manifest.** `domains/<domain>/agents/<name>.yaml` ships personas; a person or company adds or replaces one in `fgos/agents/<name>.yaml` (whole-file replacement, as 0057) and keeps its own knowledge in `fgos/knowledge/<domain>/*.md`, passed with `--context-ref`. A persona carries posture and a decision boundary, never facts or numbers. Shipped personas without a domain expert's sign-off say so in their `description`.
  2. **`fgos agents list` is the one listing.** It reads the same tiers as the seat lookup (`agent-definitions.mjs`) and prints name, tier, source file, one-line description, lower files it shadows, shape problems, render warnings, and `masked`: installed definitions that the project's own `domains/` or `core/agents/` hides. `fgos-advise` uses it instead of listing folders, so installed personas are visible from a consumer project and no persona name or domain word is written in the skill.
  3. **`fgos doctor` warns, not fails.** `agent-type-names-unique` adds the render warnings of `fgos/agents` files and the masked installed names to its message; it still fails only on duplicates, a wrong `name:`, a missing `description:` or an ignored `.yml` file.
  4. **A start states what it pinned.** A `--seats` start records `seats.refDigests` (`{ ref, sha256, bytes }`, or `unreadable`) for plain-path context refs and prints `seatsEcho`: persona names, tiers and sources, plus the ref count and total bytes. The digest is taken at start; seats read refs live, so it shows a later change and is not proof of what a seat read. The persona text itself stays pinned as in 0057.
  5. **Status says who ran each seat.** For a seated run `fgos workflow status` adds `seatProviders`: per unit and role the persona, executor, invocation, provider family, model, outcome and, after a failover, where it moved from (the 0058 `fallbackFrom`). Context documents may reach several external providers, and this is the place that shows which.
- **Reused / changed:** reused `scanAgentTiers`, `agentShapeProblem`, the 0057 pinned persona text, the 0058 `fallbackFrom` record and the existing doctor check. Added `agent-listing.mjs`, `ref-digests.mjs`, `seat-providers.mjs`, the `agents` verb and the start and status fields above. No manifest, no `extends:` or field merge, no new persona key, no routing of knowledge per seat, no change to `bind()`.
- **Boundary:** No component-boundary change. Persona and seat choice stay with `bind()` and the Workflow runner; the new modules only read.
- **Known limits / follow-ups:** nothing enforces that company knowledge stays out of external providers (a convention and the echo, not a control); a fail-closed internal-only mode needs a decision on which providers count as internal. `masked` covers `domains/` and `core/agents/` only. Persona descriptions in the marketing pack have no expert review. Additive layering of expertise on one persona, per-seat evidence routing and installed knowledge handles are not built.
Superseding this decision needs a new record; do not edit it in place.
```

### Full target unit

```text
### 0059 — A domain persona pack is a folder; what a seat can name, what it pinned and who ran it are each stated by one read

- **Status:** Settled (owner, 2026-10-12). Builds on 0057 (named persona seats) and 0058 (provider failover).
- **Context:** A domain pack (the first is the go-to-market personas in `domains/marketing/agents/`) must be extendable by a person or company without a manifest, and `fgos-advise` must find its personas without a hardcoded list. Three gaps remained after 0057: an installed persona could not be listed from a consumer project, a project's own `domains/` folder hides every shipped domain persona it lacks without any message, and the persona renderer reads only `description`, `persona.voice|style|archetype` and `decision_boundary.can_decide|must_escalate` and drops anything else silently. A seat also reads its context documents live, so the run could not say what it had been given, and a failover could send the persona and documents to a provider nobody named.
- **Decision:**
  1. **A pack is a folder, no manifest.** `domains/<domain>/agents/<name>.yaml` ships personas; a person or company adds or replaces one in `fgos/agents/<name>.yaml` (whole-file replacement, as 0057) and keeps its own knowledge in `fgos/knowledge/<domain>/*.md`, passed with `--context-ref`. A persona carries posture and a decision boundary, never facts or numbers. Shipped personas without a domain expert's sign-off say so in their `description`.
  2. **`fgos agents list` is the one listing.** It reads the same tiers as the seat lookup (`agent-definitions.mjs`) and prints name, tier, source file, one-line description, lower files it shadows, shape problems, render warnings, and `masked`: installed definitions that the project's own `domains/` or `core/agents/` hides. `fgos-advise` uses it instead of listing folders, so installed personas are visible from a consumer project and no persona name or domain word is written in the skill.
  3. **`fgos doctor` warns, not fails.** `agent-type-names-unique` adds the render warnings of `fgos/agents` files and the masked installed names to its message; it still fails only on duplicates, a wrong `name:`, a missing `description:` or an ignored `.yml` file.
  4. **A start states what it pinned.** A `--seats` start records `seats.refDigests` (`{ ref, sha256, bytes }`, or `unreadable`) for plain-path context refs and prints `seatsEcho`: persona names, tiers and sources, plus the ref count and total bytes. The digest is taken at start; seats read refs live, so it shows a later change and is not proof of what a seat read. The persona text itself stays pinned as in 0057.
  5. **Status says who ran each seat.** For a seated run `fgos workflow status` adds `seatProviders`: per unit and role the persona, executor, invocation, provider family, model, outcome and, after a failover, where it moved from (the 0058 `fallbackFrom`). Context documents may reach several external providers, and this is the place that shows which.
- **Reused / changed:** reused `scanAgentTiers`, `agentShapeProblem`, the 0057 pinned persona text, the 0058 `fallbackFrom` record and the existing doctor check. Added `agent-listing.mjs`, `ref-digests.mjs`, `seat-providers.mjs`, the `agents` verb and the start and status fields above. No manifest, no `extends:` or field merge, no new persona key, no routing of knowledge per seat, no change to `bind()`.
- **Boundary:** No component-boundary change. Persona and seat choice stay with `bind()` and the Workflow runner; the new modules only read.
- **Known limits / follow-ups:** nothing enforces that company knowledge stays out of external providers (a convention and the echo, not a control); a fail-closed internal-only mode needs a decision on which providers count as internal. `masked` covers `domains/` and `core/agents/` only. Persona descriptions in the marketing pack have no expert review. Additive layering of expertise on one persona, per-seat evidence routing and installed knowledge handles are not built.
Superseding this decision needs a new record; do not edit it in place.
```

### Full diff

```diff
No text difference.
```

## claim_ab04d755d36af00cb6ce157d829c8181

Source digest: 19c9c45fdd93380e44d303b0a25bfb118193bcc69a36c4d91fdfc662055902d1

Target digest: 19c9c45fdd93380e44d303b0a25bfb118193bcc69a36c4d91fdfc662055902d1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-325",
  "sourceLines": [
    3257,
    3268
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0059 — A domain persona pack is a folder; what a seat can name, what it pinned and who ran it are each stated by one read"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-184",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0059 — A domain persona pack is a folder; what a seat can name, what it pinned and who ran it are each stated by one read"
  ],
  "nativeTargetClaimId": "claim_30aced8c90e0a70988c9816119681d2c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ab04d755d36af00cb6ce157d829c8181",
    "sourceUnitDigest": "19c9c45fdd93380e44d303b0a25bfb118193bcc69a36c4d91fdfc662055902d1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-184",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-325 (lines 3257–3268) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-184. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "19c9c45fdd93380e44d303b0a25bfb118193bcc69a36c4d91fdfc662055902d1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0059 — A domain persona pack is a folder; what a seat can name, what it pinned and who ran it are each stated by one read"
    ]
  }
}
```

### Full source unit

```text
- **Status:** Settled (owner, 2026-10-12). Builds on 0057 (named persona seats) and 0058 (provider failover).
- **Context:** A domain pack (the first is the go-to-market personas in `domains/marketing/agents/`) must be extendable by a person or company without a manifest, and `fgos-advise` must find its personas without a hardcoded list. Three gaps remained after 0057: an installed persona could not be listed from a consumer project, a project's own `domains/` folder hides every shipped domain persona it lacks without any message, and the persona renderer reads only `description`, `persona.voice|style|archetype` and `decision_boundary.can_decide|must_escalate` and drops anything else silently. A seat also reads its context documents live, so the run could not say what it had been given, and a failover could send the persona and documents to a provider nobody named.
- **Decision:**
  1. **A pack is a folder, no manifest.** `domains/<domain>/agents/<name>.yaml` ships personas; a person or company adds or replaces one in `fgos/agents/<name>.yaml` (whole-file replacement, as 0057) and keeps its own knowledge in `fgos/knowledge/<domain>/*.md`, passed with `--context-ref`. A persona carries posture and a decision boundary, never facts or numbers. Shipped personas without a domain expert's sign-off say so in their `description`.
  2. **`fgos agents list` is the one listing.** It reads the same tiers as the seat lookup (`agent-definitions.mjs`) and prints name, tier, source file, one-line description, lower files it shadows, shape problems, render warnings, and `masked`: installed definitions that the project's own `domains/` or `core/agents/` hides. `fgos-advise` uses it instead of listing folders, so installed personas are visible from a consumer project and no persona name or domain word is written in the skill.
  3. **`fgos doctor` warns, not fails.** `agent-type-names-unique` adds the render warnings of `fgos/agents` files and the masked installed names to its message; it still fails only on duplicates, a wrong `name:`, a missing `description:` or an ignored `.yml` file.
  4. **A start states what it pinned.** A `--seats` start records `seats.refDigests` (`{ ref, sha256, bytes }`, or `unreadable`) for plain-path context refs and prints `seatsEcho`: persona names, tiers and sources, plus the ref count and total bytes. The digest is taken at start; seats read refs live, so it shows a later change and is not proof of what a seat read. The persona text itself stays pinned as in 0057.
  5. **Status says who ran each seat.** For a seated run `fgos workflow status` adds `seatProviders`: per unit and role the persona, executor, invocation, provider family, model, outcome and, after a failover, where it moved from (the 0058 `fallbackFrom`). Context documents may reach several external providers, and this is the place that shows which.
- **Reused / changed:** reused `scanAgentTiers`, `agentShapeProblem`, the 0057 pinned persona text, the 0058 `fallbackFrom` record and the existing doctor check. Added `agent-listing.mjs`, `ref-digests.mjs`, `seat-providers.mjs`, the `agents` verb and the start and status fields above. No manifest, no `extends:` or field merge, no new persona key, no routing of knowledge per seat, no change to `bind()`.
- **Boundary:** No component-boundary change. Persona and seat choice stay with `bind()` and the Workflow runner; the new modules only read.
- **Known limits / follow-ups:** nothing enforces that company knowledge stays out of external providers (a convention and the echo, not a control); a fail-closed internal-only mode needs a decision on which providers count as internal. `masked` covers `domains/` and `core/agents/` only. Persona descriptions in the marketing pack have no expert review. Additive layering of expertise on one persona, per-seat evidence routing and installed knowledge handles are not built.
Superseding this decision needs a new record; do not edit it in place.
```

### Full target unit

```text
- **Status:** Settled (owner, 2026-10-12). Builds on 0057 (named persona seats) and 0058 (provider failover).
- **Context:** A domain pack (the first is the go-to-market personas in `domains/marketing/agents/`) must be extendable by a person or company without a manifest, and `fgos-advise` must find its personas without a hardcoded list. Three gaps remained after 0057: an installed persona could not be listed from a consumer project, a project's own `domains/` folder hides every shipped domain persona it lacks without any message, and the persona renderer reads only `description`, `persona.voice|style|archetype` and `decision_boundary.can_decide|must_escalate` and drops anything else silently. A seat also reads its context documents live, so the run could not say what it had been given, and a failover could send the persona and documents to a provider nobody named.
- **Decision:**
  1. **A pack is a folder, no manifest.** `domains/<domain>/agents/<name>.yaml` ships personas; a person or company adds or replaces one in `fgos/agents/<name>.yaml` (whole-file replacement, as 0057) and keeps its own knowledge in `fgos/knowledge/<domain>/*.md`, passed with `--context-ref`. A persona carries posture and a decision boundary, never facts or numbers. Shipped personas without a domain expert's sign-off say so in their `description`.
  2. **`fgos agents list` is the one listing.** It reads the same tiers as the seat lookup (`agent-definitions.mjs`) and prints name, tier, source file, one-line description, lower files it shadows, shape problems, render warnings, and `masked`: installed definitions that the project's own `domains/` or `core/agents/` hides. `fgos-advise` uses it instead of listing folders, so installed personas are visible from a consumer project and no persona name or domain word is written in the skill.
  3. **`fgos doctor` warns, not fails.** `agent-type-names-unique` adds the render warnings of `fgos/agents` files and the masked installed names to its message; it still fails only on duplicates, a wrong `name:`, a missing `description:` or an ignored `.yml` file.
  4. **A start states what it pinned.** A `--seats` start records `seats.refDigests` (`{ ref, sha256, bytes }`, or `unreadable`) for plain-path context refs and prints `seatsEcho`: persona names, tiers and sources, plus the ref count and total bytes. The digest is taken at start; seats read refs live, so it shows a later change and is not proof of what a seat read. The persona text itself stays pinned as in 0057.
  5. **Status says who ran each seat.** For a seated run `fgos workflow status` adds `seatProviders`: per unit and role the persona, executor, invocation, provider family, model, outcome and, after a failover, where it moved from (the 0058 `fallbackFrom`). Context documents may reach several external providers, and this is the place that shows which.
- **Reused / changed:** reused `scanAgentTiers`, `agentShapeProblem`, the 0057 pinned persona text, the 0058 `fallbackFrom` record and the existing doctor check. Added `agent-listing.mjs`, `ref-digests.mjs`, `seat-providers.mjs`, the `agents` verb and the start and status fields above. No manifest, no `extends:` or field merge, no new persona key, no routing of knowledge per seat, no change to `bind()`.
- **Boundary:** No component-boundary change. Persona and seat choice stay with `bind()` and the Workflow runner; the new modules only read.
- **Known limits / follow-ups:** nothing enforces that company knowledge stays out of external providers (a convention and the echo, not a control); a fail-closed internal-only mode needs a decision on which providers count as internal. `masked` covers `domains/` and `core/agents/` only. Persona descriptions in the marketing pack have no expert review. Additive layering of expertise on one persona, per-seat evidence routing and installed knowledge handles are not built.
Superseding this decision needs a new record; do not edit it in place.
```

### Full diff

```diff
No text difference.
```

## claim_a28c06e333e3d09c3801e2b56ebd04a1

Source digest: 3298c40f0899e93402ee63927a6dcf3ea4ad38d08c6fd9af88aefb11d2457db1

Target digest: 3298c40f0899e93402ee63927a6dcf3ea4ad38d08c6fd9af88aefb11d2457db1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
  "sourceLines": [
    3270,
    3270
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_dc957881d2a375711bebce0ef94f675e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a28c06e333e3d09c3801e2b56ebd04a1",
    "sourceUnitDigest": "3298c40f0899e93402ee63927a6dcf3ea4ad38d08c6fd9af88aefb11d2457db1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052 (lines 3270–3270) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3298c40f0899e93402ee63927a6dcf3ea4ad38d08c6fd9af88aefb11d2457db1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0060 — Runner commit theo `writes` của Unit: một matcher, preflight index, resume chỉ commit, brief ghi file nói rõ phạm vi (thay mục 1-2 của 0052)

- **Trạng thái:** Settled (2026-10-14). Thay mục 1 ("runner commit `git add -A` trừ `.fgos/`") và mục 2 (subject commit) của 0052; mục 3-4 của 0052 (bỏ mọi grant git, doctor `invocation-git-write-grants`) giữ nguyên.
- **Bối cảnh:** Runner commit mọi thứ trong worktree trừ `.fgos/`, nên một agent sửa lan ra ngoài việc được giao vẫn được commit, và file người đang sửa dở trong cùng worktree bị cuốn theo. `writes` của Unit đã có nhưng không ai đọc lúc commit; settlement, Workflow và commit mỗi nơi tự hiểu path theo cách riêng (git pathspec, so chuỗi). Commit lỗi sau khi agent đã pass thì `--resume` chạy lại agent. Worker không được dặn rằng runner commit, nên có lượt tự `git commit` hoặc ghi ra ngoài rồi bị gán sai.
- **Quyết định:**
  1. **Một matcher** (`src/runner/dispatch/write-scope.mjs`, RUL84 (one write-scope matcher)): chuẩn hoá `writes` về một cách viết, chỉ `*`/`**` là glob, `.fgos/` không bao giờ trong scope; commit, settlement và Workflow đều hỏi qua `matchesWriteScope`. `runner.generatedPaths` nở scope sang cây render khi Unit chạm nguồn sinh; scope đã nở lưu ở `unit.json#writeScope` lúc tạo, resume không tính lại.
  2. **Commit theo scope** (RUL85 (the runner commits only the write scope)): runner chỉ commit path thay đổi nằm trong `writeScope`; path ngoài scope không bao giờ được commit và được báo ở `commit.outOfScope`; file bẩn sẵn trong scope (`preExistingInScope`) không bao giờ được runner commit. Subject giữ dòng đầu conventional của `summary`, nếu không thì `chore(<unitId>): …`, cho mọi caller kể cả tầng Work.
  3. **Preflight index:** index có thay đổi staged trước khi spawn producer mutating → `policy-refusal` / `foreign-staged-index`, không mở pane hay tiến trình worker. Bước commit kiểm lại (`staged-set-mismatch`, `committed-set-mismatch`) và gỡ đúng phần mình đã stage khi lỗi.
  4. **Ranh giới tin cậy của git runner:** gitdir từ repo chính, hooksPath tương đối phân giải theo main checkout, fsmonitor tắt, `GIT_*` của caller bị bỏ, worktree ngoài repo chính → `untrusted-worktree`.
  5. **Resume chỉ commit** (RUL86 (resume after a failed runner commit only commits)): round mà agent đã pass nhưng commit `failed` được resume bằng một lần commit, không bao giờ spawn agent lần hai; không còn file trong scope thì `work-missing`. Commit lạc còn trên nhánh chặn resume, gỡ bằng `git reset HEAD~1` chứ không `git revert`. Resume bị từ chối khi một dispatch còn sống giữ khoá worktree.
  6. **Brief ghi file và `needsWrites`** (RUL87 (a writing seat is told its scope)): seat mutating của unit run được brief liệt kê scope, rằng runner commit còn worker không `git add`/`git commit`, và rằng cần ghi ngoài scope thì khai `needsWrites` (field tuỳ chọn của `agent-result-claim` v2, không đổi version). `coverageMatched` của settlement đọc scope qua cùng matcher, nghĩa "nằm trong scope đã khai", không phải bằng chứng tác giả (RUL83 (a snapshot names what changed, never who) giữ nguyên).
- **Tái dùng / thiếu:** tái dùng `commitUnitWork`, chính sách attribution của RUL83 (a snapshot names what changed, never who), hợp đồng claim v2, `unit.json`. Thiếu trước đó: matcher dùng chung, preflight index, đường resume chỉ commit, dòng scope trong brief.
- **Ranh giới:** No component-boundary change. `write-scope.mjs` là module lá tầng kernel của Execution Core; Workflow chỉ gọi nó.
- **Giới hạn đã biết:** file bẩn sẵn trong scope rồi bị agent sửa tiếp thì không được báo. Brief mới chỉ áp cho unit run; đường Work giữ brief cũ.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0060 — Runner commit theo `writes` của Unit: một matcher, preflight index, resume chỉ commit, brief ghi file nói rõ phạm vi (thay mục 1-2 của 0052)

- **Trạng thái:** Settled (2026-10-14). Thay mục 1 ("runner commit `git add -A` trừ `.fgos/`") và mục 2 (subject commit) của 0052; mục 3-4 của 0052 (bỏ mọi grant git, doctor `invocation-git-write-grants`) giữ nguyên.
- **Bối cảnh:** Runner commit mọi thứ trong worktree trừ `.fgos/`, nên một agent sửa lan ra ngoài việc được giao vẫn được commit, và file người đang sửa dở trong cùng worktree bị cuốn theo. `writes` của Unit đã có nhưng không ai đọc lúc commit; settlement, Workflow và commit mỗi nơi tự hiểu path theo cách riêng (git pathspec, so chuỗi). Commit lỗi sau khi agent đã pass thì `--resume` chạy lại agent. Worker không được dặn rằng runner commit, nên có lượt tự `git commit` hoặc ghi ra ngoài rồi bị gán sai.
- **Quyết định:**
  1. **Một matcher** (`src/runner/dispatch/write-scope.mjs`, RUL84 (one write-scope matcher)): chuẩn hoá `writes` về một cách viết, chỉ `*`/`**` là glob, `.fgos/` không bao giờ trong scope; commit, settlement và Workflow đều hỏi qua `matchesWriteScope`. `runner.generatedPaths` nở scope sang cây render khi Unit chạm nguồn sinh; scope đã nở lưu ở `unit.json#writeScope` lúc tạo, resume không tính lại.
  2. **Commit theo scope** (RUL85 (the runner commits only the write scope)): runner chỉ commit path thay đổi nằm trong `writeScope`; path ngoài scope không bao giờ được commit và được báo ở `commit.outOfScope`; file bẩn sẵn trong scope (`preExistingInScope`) không bao giờ được runner commit. Subject giữ dòng đầu conventional của `summary`, nếu không thì `chore(<unitId>): …`, cho mọi caller kể cả tầng Work.
  3. **Preflight index:** index có thay đổi staged trước khi spawn producer mutating → `policy-refusal` / `foreign-staged-index`, không mở pane hay tiến trình worker. Bước commit kiểm lại (`staged-set-mismatch`, `committed-set-mismatch`) và gỡ đúng phần mình đã stage khi lỗi.
  4. **Ranh giới tin cậy của git runner:** gitdir từ repo chính, hooksPath tương đối phân giải theo main checkout, fsmonitor tắt, `GIT_*` của caller bị bỏ, worktree ngoài repo chính → `untrusted-worktree`.
  5. **Resume chỉ commit** (RUL86 (resume after a failed runner commit only commits)): round mà agent đã pass nhưng commit `failed` được resume bằng một lần commit, không bao giờ spawn agent lần hai; không còn file trong scope thì `work-missing`. Commit lạc còn trên nhánh chặn resume, gỡ bằng `git reset HEAD~1` chứ không `git revert`. Resume bị từ chối khi một dispatch còn sống giữ khoá worktree.
  6. **Brief ghi file và `needsWrites`** (RUL87 (a writing seat is told its scope)): seat mutating của unit run được brief liệt kê scope, rằng runner commit còn worker không `git add`/`git commit`, và rằng cần ghi ngoài scope thì khai `needsWrites` (field tuỳ chọn của `agent-result-claim` v2, không đổi version). `coverageMatched` của settlement đọc scope qua cùng matcher, nghĩa "nằm trong scope đã khai", không phải bằng chứng tác giả (RUL83 (a snapshot names what changed, never who) giữ nguyên).
- **Tái dùng / thiếu:** tái dùng `commitUnitWork`, chính sách attribution của RUL83 (a snapshot names what changed, never who), hợp đồng claim v2, `unit.json`. Thiếu trước đó: matcher dùng chung, preflight index, đường resume chỉ commit, dòng scope trong brief.
- **Ranh giới:** No component-boundary change. `write-scope.mjs` là module lá tầng kernel của Execution Core; Workflow chỉ gọi nó.
- **Giới hạn đã biết:** file bẩn sẵn trong scope rồi bị agent sửa tiếp thì không được báo. Brief mới chỉ áp cho unit run; đường Work giữ brief cũ.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_b31ad90d68cd5644cca87a4c3f74a438

Source digest: 31edabdb888285eb12462dd50af24bf3f6edc9af3e4afc129909d11ccca3c2ae

Target digest: 31edabdb888285eb12462dd50af24bf3f6edc9af3e4afc129909d11ccca3c2ae

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-326",
  "sourceLines": [
    3272,
    3284
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0060 — Runner commit theo `writes` của Unit: một matcher, preflight index, resume chỉ commit, brief ghi file nói rõ phạm vi (thay mục 1-2 của 0052)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-185",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0060 — Runner commit theo `writes` của Unit: một matcher, preflight index, resume chỉ commit, brief ghi file nói rõ phạm vi (thay mục 1-2 của 0052)"
  ],
  "nativeTargetClaimId": "claim_bcadc0f7245fb09be888748a392ad909",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b31ad90d68cd5644cca87a4c3f74a438",
    "sourceUnitDigest": "31edabdb888285eb12462dd50af24bf3f6edc9af3e4afc129909d11ccca3c2ae",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-185",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-326 (lines 3272–3284) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-185. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "31edabdb888285eb12462dd50af24bf3f6edc9af3e4afc129909d11ccca3c2ae",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0060 — Runner commit theo `writes` của Unit: một matcher, preflight index, resume chỉ commit, brief ghi file nói rõ phạm vi (thay mục 1-2 của 0052)"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay mục 1 ("runner commit `git add -A` trừ `.fgos/`") và mục 2 (subject commit) của 0052; mục 3-4 của 0052 (bỏ mọi grant git, doctor `invocation-git-write-grants`) giữ nguyên.
- **Bối cảnh:** Runner commit mọi thứ trong worktree trừ `.fgos/`, nên một agent sửa lan ra ngoài việc được giao vẫn được commit, và file người đang sửa dở trong cùng worktree bị cuốn theo. `writes` của Unit đã có nhưng không ai đọc lúc commit; settlement, Workflow và commit mỗi nơi tự hiểu path theo cách riêng (git pathspec, so chuỗi). Commit lỗi sau khi agent đã pass thì `--resume` chạy lại agent. Worker không được dặn rằng runner commit, nên có lượt tự `git commit` hoặc ghi ra ngoài rồi bị gán sai.
- **Quyết định:**
  1. **Một matcher** (`src/runner/dispatch/write-scope.mjs`, RUL84 (one write-scope matcher)): chuẩn hoá `writes` về một cách viết, chỉ `*`/`**` là glob, `.fgos/` không bao giờ trong scope; commit, settlement và Workflow đều hỏi qua `matchesWriteScope`. `runner.generatedPaths` nở scope sang cây render khi Unit chạm nguồn sinh; scope đã nở lưu ở `unit.json#writeScope` lúc tạo, resume không tính lại.
  2. **Commit theo scope** (RUL85 (the runner commits only the write scope)): runner chỉ commit path thay đổi nằm trong `writeScope`; path ngoài scope không bao giờ được commit và được báo ở `commit.outOfScope`; file bẩn sẵn trong scope (`preExistingInScope`) không bao giờ được runner commit. Subject giữ dòng đầu conventional của `summary`, nếu không thì `chore(<unitId>): …`, cho mọi caller kể cả tầng Work.
  3. **Preflight index:** index có thay đổi staged trước khi spawn producer mutating → `policy-refusal` / `foreign-staged-index`, không mở pane hay tiến trình worker. Bước commit kiểm lại (`staged-set-mismatch`, `committed-set-mismatch`) và gỡ đúng phần mình đã stage khi lỗi.
  4. **Ranh giới tin cậy của git runner:** gitdir từ repo chính, hooksPath tương đối phân giải theo main checkout, fsmonitor tắt, `GIT_*` của caller bị bỏ, worktree ngoài repo chính → `untrusted-worktree`.
  5. **Resume chỉ commit** (RUL86 (resume after a failed runner commit only commits)): round mà agent đã pass nhưng commit `failed` được resume bằng một lần commit, không bao giờ spawn agent lần hai; không còn file trong scope thì `work-missing`. Commit lạc còn trên nhánh chặn resume, gỡ bằng `git reset HEAD~1` chứ không `git revert`. Resume bị từ chối khi một dispatch còn sống giữ khoá worktree.
  6. **Brief ghi file và `needsWrites`** (RUL87 (a writing seat is told its scope)): seat mutating của unit run được brief liệt kê scope, rằng runner commit còn worker không `git add`/`git commit`, và rằng cần ghi ngoài scope thì khai `needsWrites` (field tuỳ chọn của `agent-result-claim` v2, không đổi version). `coverageMatched` của settlement đọc scope qua cùng matcher, nghĩa "nằm trong scope đã khai", không phải bằng chứng tác giả (RUL83 (a snapshot names what changed, never who) giữ nguyên).
- **Tái dùng / thiếu:** tái dùng `commitUnitWork`, chính sách attribution của RUL83 (a snapshot names what changed, never who), hợp đồng claim v2, `unit.json`. Thiếu trước đó: matcher dùng chung, preflight index, đường resume chỉ commit, dòng scope trong brief.
- **Ranh giới:** No component-boundary change. `write-scope.mjs` là module lá tầng kernel của Execution Core; Workflow chỉ gọi nó.
- **Giới hạn đã biết:** file bẩn sẵn trong scope rồi bị agent sửa tiếp thì không được báo. Brief mới chỉ áp cho unit run; đường Work giữ brief cũ.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay mục 1 ("runner commit `git add -A` trừ `.fgos/`") và mục 2 (subject commit) của 0052; mục 3-4 của 0052 (bỏ mọi grant git, doctor `invocation-git-write-grants`) giữ nguyên.
- **Bối cảnh:** Runner commit mọi thứ trong worktree trừ `.fgos/`, nên một agent sửa lan ra ngoài việc được giao vẫn được commit, và file người đang sửa dở trong cùng worktree bị cuốn theo. `writes` của Unit đã có nhưng không ai đọc lúc commit; settlement, Workflow và commit mỗi nơi tự hiểu path theo cách riêng (git pathspec, so chuỗi). Commit lỗi sau khi agent đã pass thì `--resume` chạy lại agent. Worker không được dặn rằng runner commit, nên có lượt tự `git commit` hoặc ghi ra ngoài rồi bị gán sai.
- **Quyết định:**
  1. **Một matcher** (`src/runner/dispatch/write-scope.mjs`, RUL84 (one write-scope matcher)): chuẩn hoá `writes` về một cách viết, chỉ `*`/`**` là glob, `.fgos/` không bao giờ trong scope; commit, settlement và Workflow đều hỏi qua `matchesWriteScope`. `runner.generatedPaths` nở scope sang cây render khi Unit chạm nguồn sinh; scope đã nở lưu ở `unit.json#writeScope` lúc tạo, resume không tính lại.
  2. **Commit theo scope** (RUL85 (the runner commits only the write scope)): runner chỉ commit path thay đổi nằm trong `writeScope`; path ngoài scope không bao giờ được commit và được báo ở `commit.outOfScope`; file bẩn sẵn trong scope (`preExistingInScope`) không bao giờ được runner commit. Subject giữ dòng đầu conventional của `summary`, nếu không thì `chore(<unitId>): …`, cho mọi caller kể cả tầng Work.
  3. **Preflight index:** index có thay đổi staged trước khi spawn producer mutating → `policy-refusal` / `foreign-staged-index`, không mở pane hay tiến trình worker. Bước commit kiểm lại (`staged-set-mismatch`, `committed-set-mismatch`) và gỡ đúng phần mình đã stage khi lỗi.
  4. **Ranh giới tin cậy của git runner:** gitdir từ repo chính, hooksPath tương đối phân giải theo main checkout, fsmonitor tắt, `GIT_*` của caller bị bỏ, worktree ngoài repo chính → `untrusted-worktree`.
  5. **Resume chỉ commit** (RUL86 (resume after a failed runner commit only commits)): round mà agent đã pass nhưng commit `failed` được resume bằng một lần commit, không bao giờ spawn agent lần hai; không còn file trong scope thì `work-missing`. Commit lạc còn trên nhánh chặn resume, gỡ bằng `git reset HEAD~1` chứ không `git revert`. Resume bị từ chối khi một dispatch còn sống giữ khoá worktree.
  6. **Brief ghi file và `needsWrites`** (RUL87 (a writing seat is told its scope)): seat mutating của unit run được brief liệt kê scope, rằng runner commit còn worker không `git add`/`git commit`, và rằng cần ghi ngoài scope thì khai `needsWrites` (field tuỳ chọn của `agent-result-claim` v2, không đổi version). `coverageMatched` của settlement đọc scope qua cùng matcher, nghĩa "nằm trong scope đã khai", không phải bằng chứng tác giả (RUL83 (a snapshot names what changed, never who) giữ nguyên).
- **Tái dùng / thiếu:** tái dùng `commitUnitWork`, chính sách attribution của RUL83 (a snapshot names what changed, never who), hợp đồng claim v2, `unit.json`. Thiếu trước đó: matcher dùng chung, preflight index, đường resume chỉ commit, dòng scope trong brief.
- **Ranh giới:** No component-boundary change. `write-scope.mjs` là module lá tầng kernel của Execution Core; Workflow chỉ gọi nó.
- **Giới hạn đã biết:** file bẩn sẵn trong scope rồi bị agent sửa tiếp thì không được báo. Brief mới chỉ áp cho unit run; đường Work giữ brief cũ.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_ad2cb8f645df6b08658a2b32ae2a8dcb

Source digest: 648a519ae124396088ceac1e0c3a0784742df48f2ab04e2423ef576065cf5da4

Target digest: 648a519ae124396088ceac1e0c3a0784742df48f2ab04e2423ef576065cf5da4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
  "sourceLines": [
    3286,
    3286
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_e137d228d35b8cdfaa2933e840348246",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ad2cb8f645df6b08658a2b32ae2a8dcb",
    "sourceUnitDigest": "648a519ae124396088ceac1e0c3a0784742df48f2ab04e2423ef576065cf5da4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047 (lines 3286–3286) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "648a519ae124396088ceac1e0c3a0784742df48f2ab04e2423ef576065cf5da4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0061 — Unit ad-hoc được `prefer`/`persona` mềm; one-liner `fgos run "<prompt>"`; `workflow start --units`/`--effort`; unit ghi nối nhánh (thay một phần mục 1 của 0047)

- **Trạng thái:** Settled (2026-10-14). Thay một phần mục 1 của 0047: Unit nay được mang `prefer` và `persona`; executor, provider, model, tier, invocation, actors, overrides vẫn bị cấm (G2). Các mục khác của 0047 giữ nguyên.
- **Bối cảnh:** Việc một lần cần ba đường khác nhau tuỳ có ghi file và có cần provider cụ thể hay không (RUL77 (posture belongs to the capability)): `execute <agent> --for`, Workflow unit `writes: []`, hay `execute --contract --executor`; không đường nào vừa sandbox read-only vừa giữ được provider đã chọn. Doctrine dạy `fgos workflow start --units` khi cờ đó chưa có. RUL77 (posture belongs to the capability) để ngỏ "gợi ý provider mềm" vì nó đổi `bind()`. Persona của unit chỉ đọc `core/agents` của project đang chạy, nên persona tầng workspace render ra tên trần.
- **Quyết định:**
  1. **`prefer`/`persona` mềm trên Unit ad-hoc** (RUL88 (ad-hoc Unit prefer and persona, the one-liner)): `bind()` thử `unit.prefer` trước rồi tới `capability.prefer`, qua cùng mọi bộ lọc và failover vào pool; provenance ghi `unit-prefer`; `--override` executor vẫn ghim. Persona: override > `unit.persona` > locked > capability; xung đột locked/unit bị từ chối. Persona của unit được resolve qua ba tầng và ghim text vào `unit.json` lúc unit run bắt đầu. Preset và plan vẫn không ghim provider; chỉ nguồn `units-file` được mang `prefer`.
  2. **One-liner** `fgos run "<prompt>" [--provider] [--persona] [--writes --worktree] [--capability] [--rigor] [--effort]`: dựng một Unit `adhoc-*`, read-only khi không có `--writes`; `--writes` cần linked worktree; cờ sai bị từ chối trước khi có unit run.
  3. **`fgos workflow start --units <file>`** (RUL89 (workflow start --units)): danh sách Unit chạy như một Workflow tạm, mỗi Unit một step; `--effort <level>` áp cho mọi unit và giữ qua resume; không đi cùng `--seats`.
  4. **Unit ghi nối nhánh:** unit ghi đứng trên đúng một unit ghi khác bắt đầu từ nhánh của unit đó; ≥2 thì từ chối lúc start; không tự merge, `workflow status` liệt kê `writeBranches`. Unit ghi ngoài scope ra `findings`; step integrate gặp unit như vậy thì fail, không merge gì. Unit ghi không có worktree riêng thì fail, không chạy trong checkout dùng chung.
- **Tái dùng / thiếu:** tái dùng `bind()` (thêm nguồn ứng viên, không đổi chấm điểm), failover của 0058, rải họ của 0055, tra cứu ba tầng của 0057, override `reasoningEffort` của `fgos run --effort`, `contextRefs` của 0053. Thiếu trước đó: nguồn `unit-prefer`, bộ dựng Unit từ prompt, loader units file, nối nhánh giữa unit ghi.
- **Ranh giới:** No component-boundary change. Chọn executor vẫn chỉ ở `bind()`; Workflow component chỉ dịch units file thành step và chọn base của worktree.
- **Giới hạn đã biết:** unit ghi sau step integrate vẫn bắt đầu từ HEAD của main checkout. `dispatch decide` không có gợi ý mềm. Failover có `prefer` qua herdr-spawn chưa đo được trên provider-limit thật.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0061 — Unit ad-hoc được `prefer`/`persona` mềm; one-liner `fgos run "<prompt>"`; `workflow start --units`/`--effort`; unit ghi nối nhánh (thay một phần mục 1 của 0047)

- **Trạng thái:** Settled (2026-10-14). Thay một phần mục 1 của 0047: Unit nay được mang `prefer` và `persona`; executor, provider, model, tier, invocation, actors, overrides vẫn bị cấm (G2). Các mục khác của 0047 giữ nguyên.
- **Bối cảnh:** Việc một lần cần ba đường khác nhau tuỳ có ghi file và có cần provider cụ thể hay không (RUL77 (posture belongs to the capability)): `execute <agent> --for`, Workflow unit `writes: []`, hay `execute --contract --executor`; không đường nào vừa sandbox read-only vừa giữ được provider đã chọn. Doctrine dạy `fgos workflow start --units` khi cờ đó chưa có. RUL77 (posture belongs to the capability) để ngỏ "gợi ý provider mềm" vì nó đổi `bind()`. Persona của unit chỉ đọc `core/agents` của project đang chạy, nên persona tầng workspace render ra tên trần.
- **Quyết định:**
  1. **`prefer`/`persona` mềm trên Unit ad-hoc** (RUL88 (ad-hoc Unit prefer and persona, the one-liner)): `bind()` thử `unit.prefer` trước rồi tới `capability.prefer`, qua cùng mọi bộ lọc và failover vào pool; provenance ghi `unit-prefer`; `--override` executor vẫn ghim. Persona: override > `unit.persona` > locked > capability; xung đột locked/unit bị từ chối. Persona của unit được resolve qua ba tầng và ghim text vào `unit.json` lúc unit run bắt đầu. Preset và plan vẫn không ghim provider; chỉ nguồn `units-file` được mang `prefer`.
  2. **One-liner** `fgos run "<prompt>" [--provider] [--persona] [--writes --worktree] [--capability] [--rigor] [--effort]`: dựng một Unit `adhoc-*`, read-only khi không có `--writes`; `--writes` cần linked worktree; cờ sai bị từ chối trước khi có unit run.
  3. **`fgos workflow start --units <file>`** (RUL89 (workflow start --units)): danh sách Unit chạy như một Workflow tạm, mỗi Unit một step; `--effort <level>` áp cho mọi unit và giữ qua resume; không đi cùng `--seats`.
  4. **Unit ghi nối nhánh:** unit ghi đứng trên đúng một unit ghi khác bắt đầu từ nhánh của unit đó; ≥2 thì từ chối lúc start; không tự merge, `workflow status` liệt kê `writeBranches`. Unit ghi ngoài scope ra `findings`; step integrate gặp unit như vậy thì fail, không merge gì. Unit ghi không có worktree riêng thì fail, không chạy trong checkout dùng chung.
- **Tái dùng / thiếu:** tái dùng `bind()` (thêm nguồn ứng viên, không đổi chấm điểm), failover của 0058, rải họ của 0055, tra cứu ba tầng của 0057, override `reasoningEffort` của `fgos run --effort`, `contextRefs` của 0053. Thiếu trước đó: nguồn `unit-prefer`, bộ dựng Unit từ prompt, loader units file, nối nhánh giữa unit ghi.
- **Ranh giới:** No component-boundary change. Chọn executor vẫn chỉ ở `bind()`; Workflow component chỉ dịch units file thành step và chọn base của worktree.
- **Giới hạn đã biết:** unit ghi sau step integrate vẫn bắt đầu từ HEAD của main checkout. `dispatch decide` không có gợi ý mềm. Failover có `prefer` qua herdr-spawn chưa đo được trên provider-limit thật.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_e1abc43e9b408449d93b9fa00a00dd68

Source digest: a1fa418f9e8efd39553b8f30c10b134e1192646b08b68db4225de81de04b5237

Target digest: a1fa418f9e8efd39553b8f30c10b134e1192646b08b68db4225de81de04b5237

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-327",
  "sourceLines": [
    3288,
    3298
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0061 — Unit ad-hoc được `prefer`/`persona` mềm; one-liner `fgos run \"<prompt>\"`; `workflow start --units`/`--effort`; unit ghi nối nhánh (thay một phần mục 1 của 0047)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-186",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0061 — Unit ad-hoc được `prefer`/`persona` mềm; one-liner `fgos run \"<prompt>\"`; `workflow start --units`/`--effort`; unit ghi nối nhánh (thay một phần mục 1 của 0047)"
  ],
  "nativeTargetClaimId": "claim_fb79152fc69d911a178c27834d51e40a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e1abc43e9b408449d93b9fa00a00dd68",
    "sourceUnitDigest": "a1fa418f9e8efd39553b8f30c10b134e1192646b08b68db4225de81de04b5237",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-186",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-327 (lines 3288–3298) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-186. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a1fa418f9e8efd39553b8f30c10b134e1192646b08b68db4225de81de04b5237",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0061 — Unit ad-hoc được `prefer`/`persona` mềm; one-liner `fgos run \"<prompt>\"`; `workflow start --units`/`--effort`; unit ghi nối nhánh (thay một phần mục 1 của 0047)"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay một phần mục 1 của 0047: Unit nay được mang `prefer` và `persona`; executor, provider, model, tier, invocation, actors, overrides vẫn bị cấm (G2). Các mục khác của 0047 giữ nguyên.
- **Bối cảnh:** Việc một lần cần ba đường khác nhau tuỳ có ghi file và có cần provider cụ thể hay không (RUL77 (posture belongs to the capability)): `execute <agent> --for`, Workflow unit `writes: []`, hay `execute --contract --executor`; không đường nào vừa sandbox read-only vừa giữ được provider đã chọn. Doctrine dạy `fgos workflow start --units` khi cờ đó chưa có. RUL77 (posture belongs to the capability) để ngỏ "gợi ý provider mềm" vì nó đổi `bind()`. Persona của unit chỉ đọc `core/agents` của project đang chạy, nên persona tầng workspace render ra tên trần.
- **Quyết định:**
  1. **`prefer`/`persona` mềm trên Unit ad-hoc** (RUL88 (ad-hoc Unit prefer and persona, the one-liner)): `bind()` thử `unit.prefer` trước rồi tới `capability.prefer`, qua cùng mọi bộ lọc và failover vào pool; provenance ghi `unit-prefer`; `--override` executor vẫn ghim. Persona: override > `unit.persona` > locked > capability; xung đột locked/unit bị từ chối. Persona của unit được resolve qua ba tầng và ghim text vào `unit.json` lúc unit run bắt đầu. Preset và plan vẫn không ghim provider; chỉ nguồn `units-file` được mang `prefer`.
  2. **One-liner** `fgos run "<prompt>" [--provider] [--persona] [--writes --worktree] [--capability] [--rigor] [--effort]`: dựng một Unit `adhoc-*`, read-only khi không có `--writes`; `--writes` cần linked worktree; cờ sai bị từ chối trước khi có unit run.
  3. **`fgos workflow start --units <file>`** (RUL89 (workflow start --units)): danh sách Unit chạy như một Workflow tạm, mỗi Unit một step; `--effort <level>` áp cho mọi unit và giữ qua resume; không đi cùng `--seats`.
  4. **Unit ghi nối nhánh:** unit ghi đứng trên đúng một unit ghi khác bắt đầu từ nhánh của unit đó; ≥2 thì từ chối lúc start; không tự merge, `workflow status` liệt kê `writeBranches`. Unit ghi ngoài scope ra `findings`; step integrate gặp unit như vậy thì fail, không merge gì. Unit ghi không có worktree riêng thì fail, không chạy trong checkout dùng chung.
- **Tái dùng / thiếu:** tái dùng `bind()` (thêm nguồn ứng viên, không đổi chấm điểm), failover của 0058, rải họ của 0055, tra cứu ba tầng của 0057, override `reasoningEffort` của `fgos run --effort`, `contextRefs` của 0053. Thiếu trước đó: nguồn `unit-prefer`, bộ dựng Unit từ prompt, loader units file, nối nhánh giữa unit ghi.
- **Ranh giới:** No component-boundary change. Chọn executor vẫn chỉ ở `bind()`; Workflow component chỉ dịch units file thành step và chọn base của worktree.
- **Giới hạn đã biết:** unit ghi sau step integrate vẫn bắt đầu từ HEAD của main checkout. `dispatch decide` không có gợi ý mềm. Failover có `prefer` qua herdr-spawn chưa đo được trên provider-limit thật.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay một phần mục 1 của 0047: Unit nay được mang `prefer` và `persona`; executor, provider, model, tier, invocation, actors, overrides vẫn bị cấm (G2). Các mục khác của 0047 giữ nguyên.
- **Bối cảnh:** Việc một lần cần ba đường khác nhau tuỳ có ghi file và có cần provider cụ thể hay không (RUL77 (posture belongs to the capability)): `execute <agent> --for`, Workflow unit `writes: []`, hay `execute --contract --executor`; không đường nào vừa sandbox read-only vừa giữ được provider đã chọn. Doctrine dạy `fgos workflow start --units` khi cờ đó chưa có. RUL77 (posture belongs to the capability) để ngỏ "gợi ý provider mềm" vì nó đổi `bind()`. Persona của unit chỉ đọc `core/agents` của project đang chạy, nên persona tầng workspace render ra tên trần.
- **Quyết định:**
  1. **`prefer`/`persona` mềm trên Unit ad-hoc** (RUL88 (ad-hoc Unit prefer and persona, the one-liner)): `bind()` thử `unit.prefer` trước rồi tới `capability.prefer`, qua cùng mọi bộ lọc và failover vào pool; provenance ghi `unit-prefer`; `--override` executor vẫn ghim. Persona: override > `unit.persona` > locked > capability; xung đột locked/unit bị từ chối. Persona của unit được resolve qua ba tầng và ghim text vào `unit.json` lúc unit run bắt đầu. Preset và plan vẫn không ghim provider; chỉ nguồn `units-file` được mang `prefer`.
  2. **One-liner** `fgos run "<prompt>" [--provider] [--persona] [--writes --worktree] [--capability] [--rigor] [--effort]`: dựng một Unit `adhoc-*`, read-only khi không có `--writes`; `--writes` cần linked worktree; cờ sai bị từ chối trước khi có unit run.
  3. **`fgos workflow start --units <file>`** (RUL89 (workflow start --units)): danh sách Unit chạy như một Workflow tạm, mỗi Unit một step; `--effort <level>` áp cho mọi unit và giữ qua resume; không đi cùng `--seats`.
  4. **Unit ghi nối nhánh:** unit ghi đứng trên đúng một unit ghi khác bắt đầu từ nhánh của unit đó; ≥2 thì từ chối lúc start; không tự merge, `workflow status` liệt kê `writeBranches`. Unit ghi ngoài scope ra `findings`; step integrate gặp unit như vậy thì fail, không merge gì. Unit ghi không có worktree riêng thì fail, không chạy trong checkout dùng chung.
- **Tái dùng / thiếu:** tái dùng `bind()` (thêm nguồn ứng viên, không đổi chấm điểm), failover của 0058, rải họ của 0055, tra cứu ba tầng của 0057, override `reasoningEffort` của `fgos run --effort`, `contextRefs` của 0053. Thiếu trước đó: nguồn `unit-prefer`, bộ dựng Unit từ prompt, loader units file, nối nhánh giữa unit ghi.
- **Ranh giới:** No component-boundary change. Chọn executor vẫn chỉ ở `bind()`; Workflow component chỉ dịch units file thành step và chọn base của worktree.
- **Giới hạn đã biết:** unit ghi sau step integrate vẫn bắt đầu từ HEAD của main checkout. `dispatch decide` không có gợi ý mềm. Failover có `prefer` qua herdr-spawn chưa đo được trên provider-limit thật.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_f679b132df0a3819847b51552ab3a9b6

Source digest: 73fa71a8c6944bbf866662ca0a909000ae3e16d38770acaa3643ac86cb1052fc

Target digest: 73fa71a8c6944bbf866662ca0a909000ae3e16d38770acaa3643ac86cb1052fc

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
  "sourceLines": [
    3300,
    3300
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_5f52648cb80a47a33868ac17b57286bb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f679b132df0a3819847b51552ab3a9b6",
    "sourceUnitDigest": "73fa71a8c6944bbf866662ca0a909000ae3e16d38770acaa3643ac86cb1052fc",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability (lines 3300–3300) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "73fa71a8c6944bbf866662ca0a909000ae3e16d38770acaa3643ac86cb1052fc",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work (thay phần purpose door của RUL68 (2 tầng dispatch) và phần "mỗi cửa một lane posture" của RUL77 (posture belongs to the capability))

- **Trạng thái:** Settled (2026-10-14). Thay phần purpose door của RUL68 (2 tầng dispatch): `executeExecutorCli` không còn cửa CLI nào, là bước transport của Assignment (caller còn lại `fanout-batch.mjs` nằm trong `R3_PENDING_WORK_CALLERS` tới khi fanout chạy qua `runUnit`); tầng Assignment có lease/fallback giữ nguyên. Thay phần "each door carries one posture lane" của RUL77 (posture belongs to the capability); phần "agent executor không khai `for`, `for` của nó inert" giữ nguyên.
- **Bối cảnh:** Sau M1 đã có hai cửa trên một `runUnit` (one-liner `fgos run "<prompt>"`, `fgos workflow start --units`; 0060, 0061), nhưng cửa thô vẫn sống: `dispatch execute` theo executor id, dạng `--contract` và dạng `--assignment`, cùng `dispatch log` và `dispatch fanout-batch`. Mỗi cửa mang một lane posture riêng (RUL77 (posture belongs to the capability)), nên doctrine dạy ba đường cho cùng một việc, và việc đọc qua `--contract` giữ provider nhưng không sandbox. P3 phase 5 đã định xoá `dispatch execute <executor>` (`ad9a23a9f`) nhưng tiêu chí xong không kiểm việc đó nên bị bỏ dở. Owner quyết xoá (quyết định 4 của owner, đầu vào của hội đồng mở lại r4).
- **Quyết định:**
  1. **Xoá cửa thô** (RUL90 (the raw dispatch doors are removed)): `dispatch execute` (theo executor id, `--contract`, `--assignment`), `dispatch log`, `dispatch fanout-batch` và module `dispatch-log.mjs`. Gọi `dispatch execute` (mọi dạng) hoặc `dispatch log` trả lỗi `validation` gồm một câu chỉ đường, đặt ở một chỗ trong `bin` và tới được caller dạng `returnResult`: `execute` → `fgos run "<prompt>" [--provider <executor>] [--capability <c>] [--writes …]` hoặc `fgos run --unit` (chỉ ghi `--provider` khi executor là kind `agent`, vì `fgos run` từ chối kind khác; executor kind `tool` được bảo gọi thẳng tool; capability `--for` đã đăng ký được giữ; thông điệp BLOCKED của hook dựng cùng cách qua `runDoorHint`); `--assignment` → `fgos run --unit` hoặc Workflow; `dispatch log` → provenance nằm ở `.fgos/assignments/<unitRunId>/`.
  2. **Dispatch là tầng thấp:** `fgos dispatch` chỉ còn `decide`, `inspect`, `reconcile`, `probe-account`. `dispatch.mjs` không import tầng Work; `decide --work` nhận resolver Work tiêm từ `bin` (tham số `resolveWork` sẵn có), nên chỉ chạy qua `fgos dispatch decide --work`.
  3. **Posture lấy từ `writes` + capability, không từ cửa:** Unit không có `writes` chạy read-only có sandbox và lease account; có `writes` thì mutating trong linked worktree, runner commit theo scope (0060). Capability có required confinement vẫn áp. Provider cụ thể là `prefer` mềm (0061), không còn cửa nào ghim provider ngoài `--override` của người.
  4. **Fanout về tầng Work, không thêm verb:** lối vào `node src/runner/fanout-batch.mjs "<ids>" [--has-live-task-access]`, khoá output ổn định `fired`, `mechanismChanged`, `unavailable`, `deferred` (cộng `slotsFull: true` khi hết slot). Bảng route Rust không đổi. Phần ruột chuyển sang `runUnit` khi cắt Work; shape của từng phần tử `fired` chốt ở bước đó.
  5. **Guard khoá việc xoá:** guard import mở rộng tới `dispatch.mjs` và `src/workflow/**`, không allowlist; guard import đi bắc cầu qua import tương đối (re-export cách nhiều bước vẫn tính), đọc cả `require()` và `import()` literal; guard call-site quét `src`, `bin`, `scripts`, `domains`, `core`, ghi đích danh file được gọi `executeAssignment`, `executeExecutorCli`, `commitUnitWork`, `executeThroughConfinement` (import alias, destructure, namespace đều tính là gọi; `export *` từ module nhà của chúng bị từ chối); caller tầng Work chưa chuyển nằm trong `R3_PENDING_WORK_CALLERS` và phải về rỗng khi cắt Work xong.
  6. **Doctrine một nguồn:** `AGENTS.md` và mọi skill (nguồn `core/skills`, `domains/**`, render `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`) dạy `fgos run`; `test/docs/run-doors-doctrine.test.mjs` từ chối mọi bề mặt còn dạy `dispatch execute`/`log`/`fanout-batch`, `--contract` hay `decide --work` qua `node`.
- **RUL81 (`--contract` có sandbox, chỉ trên nhánh `fix/dispatch-followups`) chưa từng vào main.** Nó chỉ có trên nhánh `fix/dispatch-followups` (`af132275b`: `--contract` cộng `--for <capability confined>`, `contractPostureBinding`); owner bỏ merge nhánh đó (r4 quyết định 4), lane gom đánh lại hai quy tắc của lane ghi thành RUL82 (`RunResult.confinement` names the backend that ran) và RUL83 (a snapshot names what changed, never who), để trống số 81. 0062 không thay quy tắc nào mang số đó.
- **Dissent giữ lại (hội đồng r4):**
  - *Đo trước khi dựng cửa ngắn* (panelist-2: doctrine trước, đo, chỉ dựng khi cần; framing, panelist-1, panelist-3 muốn dựng ngay): owner bác bằng quyết định 4 cùng bằng chứng nhu cầu 19 lượt, **không bị bác bỏ về lý**. Rủi ro còn lại: không có số đếm caller ngoài repo của `dispatch execute <executor>` và `--assignment`; giảm thiểu bằng lỗi chỉ đường.
  - *Hình dạng confinement cho việc chỉ ghi docs* vẫn để mở: framing/panelist-1 muốn posture thứ ba có tên qua `bind()`; panelist-2 muốn allowlist theo capability, fail closed lúc ghi; panelist-3 muốn không bwrap subpath, dùng worktree + kiểm scope. RUL85 (the runner commits only the write scope) chỉ hiện thực biến thể quan sát-rồi-commit của panelist-3; chưa phương án nào được chứng minh.
- **Tái dùng / thiếu:** tái dùng `runUnit`, `prefer` mềm của 0061, commit theo scope của 0060, test call-site sẵn có ở `test/architecture.test.mjs`, tham số `resolveWork` của `decide`. Thiếu trước đó: guard khoá việc xoá `dispatch execute <executor>` (lý do P3 phase 5 bỏ dở), lối vào `node` cho fanout, test doctrine chặn cửa cũ.
- **Ranh giới:** Component-boundary change: dispatch mất cửa thực thi và không còn phụ thuộc tầng Work; Work chỉ còn là bên dùng `runUnit`/dispatch.
- **Giới hạn đã biết:** caller ngoài repo gọi cửa đã xoá chỉ nhận lỗi chỉ đường (owner chấp nhận). Project khác giữ bản render dạy cửa cũ tới khi activate release mới và chạy `fgos setup`. Tài liệu người dùng (`docs/how-to`, `docs/reference`, how-to trong `docs/knowledge`) đã chuyển sang `fgos run`; tài liệu giải thích và bản ghi lịch sử (`docs/explanation`, why-* trong `docs/knowledge`, `docs/{platform,architect}/agent-coordination`) giữ nguyên lệnh cũ kèm ghi chú cửa đã xoá; `docs/history/**` và `plans/**` không sửa. Fanout và vòng loop chưa đi qua `runUnit`, nên `R3_PENDING_WORK_CALLERS` chưa rỗng.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work (thay phần purpose door của RUL68 (2 tầng dispatch) và phần "mỗi cửa một lane posture" của RUL77 (posture belongs to the capability))

- **Trạng thái:** Settled (2026-10-14). Thay phần purpose door của RUL68 (2 tầng dispatch): `executeExecutorCli` không còn cửa CLI nào, là bước transport của Assignment (caller còn lại `fanout-batch.mjs` nằm trong `R3_PENDING_WORK_CALLERS` tới khi fanout chạy qua `runUnit`); tầng Assignment có lease/fallback giữ nguyên. Thay phần "each door carries one posture lane" của RUL77 (posture belongs to the capability); phần "agent executor không khai `for`, `for` của nó inert" giữ nguyên.
- **Bối cảnh:** Sau M1 đã có hai cửa trên một `runUnit` (one-liner `fgos run "<prompt>"`, `fgos workflow start --units`; 0060, 0061), nhưng cửa thô vẫn sống: `dispatch execute` theo executor id, dạng `--contract` và dạng `--assignment`, cùng `dispatch log` và `dispatch fanout-batch`. Mỗi cửa mang một lane posture riêng (RUL77 (posture belongs to the capability)), nên doctrine dạy ba đường cho cùng một việc, và việc đọc qua `--contract` giữ provider nhưng không sandbox. P3 phase 5 đã định xoá `dispatch execute <executor>` (`ad9a23a9f`) nhưng tiêu chí xong không kiểm việc đó nên bị bỏ dở. Owner quyết xoá (quyết định 4 của owner, đầu vào của hội đồng mở lại r4).
- **Quyết định:**
  1. **Xoá cửa thô** (RUL90 (the raw dispatch doors are removed)): `dispatch execute` (theo executor id, `--contract`, `--assignment`), `dispatch log`, `dispatch fanout-batch` và module `dispatch-log.mjs`. Gọi `dispatch execute` (mọi dạng) hoặc `dispatch log` trả lỗi `validation` gồm một câu chỉ đường, đặt ở một chỗ trong `bin` và tới được caller dạng `returnResult`: `execute` → `fgos run "<prompt>" [--provider <executor>] [--capability <c>] [--writes …]` hoặc `fgos run --unit` (chỉ ghi `--provider` khi executor là kind `agent`, vì `fgos run` từ chối kind khác; executor kind `tool` được bảo gọi thẳng tool; capability `--for` đã đăng ký được giữ; thông điệp BLOCKED của hook dựng cùng cách qua `runDoorHint`); `--assignment` → `fgos run --unit` hoặc Workflow; `dispatch log` → provenance nằm ở `.fgos/assignments/<unitRunId>/`.
  2. **Dispatch là tầng thấp:** `fgos dispatch` chỉ còn `decide`, `inspect`, `reconcile`, `probe-account`. `dispatch.mjs` không import tầng Work; `decide --work` nhận resolver Work tiêm từ `bin` (tham số `resolveWork` sẵn có), nên chỉ chạy qua `fgos dispatch decide --work`.
  3. **Posture lấy từ `writes` + capability, không từ cửa:** Unit không có `writes` chạy read-only có sandbox và lease account; có `writes` thì mutating trong linked worktree, runner commit theo scope (0060). Capability có required confinement vẫn áp. Provider cụ thể là `prefer` mềm (0061), không còn cửa nào ghim provider ngoài `--override` của người.
  4. **Fanout về tầng Work, không thêm verb:** lối vào `node src/runner/fanout-batch.mjs "<ids>" [--has-live-task-access]`, khoá output ổn định `fired`, `mechanismChanged`, `unavailable`, `deferred` (cộng `slotsFull: true` khi hết slot). Bảng route Rust không đổi. Phần ruột chuyển sang `runUnit` khi cắt Work; shape của từng phần tử `fired` chốt ở bước đó.
  5. **Guard khoá việc xoá:** guard import mở rộng tới `dispatch.mjs` và `src/workflow/**`, không allowlist; guard import đi bắc cầu qua import tương đối (re-export cách nhiều bước vẫn tính), đọc cả `require()` và `import()` literal; guard call-site quét `src`, `bin`, `scripts`, `domains`, `core`, ghi đích danh file được gọi `executeAssignment`, `executeExecutorCli`, `commitUnitWork`, `executeThroughConfinement` (import alias, destructure, namespace đều tính là gọi; `export *` từ module nhà của chúng bị từ chối); caller tầng Work chưa chuyển nằm trong `R3_PENDING_WORK_CALLERS` và phải về rỗng khi cắt Work xong.
  6. **Doctrine một nguồn:** `AGENTS.md` và mọi skill (nguồn `core/skills`, `domains/**`, render `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`) dạy `fgos run`; `test/docs/run-doors-doctrine.test.mjs` từ chối mọi bề mặt còn dạy `dispatch execute`/`log`/`fanout-batch`, `--contract` hay `decide --work` qua `node`.
- **RUL81 (`--contract` có sandbox, chỉ trên nhánh `fix/dispatch-followups`) chưa từng vào main.** Nó chỉ có trên nhánh `fix/dispatch-followups` (`af132275b`: `--contract` cộng `--for <capability confined>`, `contractPostureBinding`); owner bỏ merge nhánh đó (r4 quyết định 4), lane gom đánh lại hai quy tắc của lane ghi thành RUL82 (`RunResult.confinement` names the backend that ran) và RUL83 (a snapshot names what changed, never who), để trống số 81. 0062 không thay quy tắc nào mang số đó.
- **Dissent giữ lại (hội đồng r4):**
  - *Đo trước khi dựng cửa ngắn* (panelist-2: doctrine trước, đo, chỉ dựng khi cần; framing, panelist-1, panelist-3 muốn dựng ngay): owner bác bằng quyết định 4 cùng bằng chứng nhu cầu 19 lượt, **không bị bác bỏ về lý**. Rủi ro còn lại: không có số đếm caller ngoài repo của `dispatch execute <executor>` và `--assignment`; giảm thiểu bằng lỗi chỉ đường.
  - *Hình dạng confinement cho việc chỉ ghi docs* vẫn để mở: framing/panelist-1 muốn posture thứ ba có tên qua `bind()`; panelist-2 muốn allowlist theo capability, fail closed lúc ghi; panelist-3 muốn không bwrap subpath, dùng worktree + kiểm scope. RUL85 (the runner commits only the write scope) chỉ hiện thực biến thể quan sát-rồi-commit của panelist-3; chưa phương án nào được chứng minh.
- **Tái dùng / thiếu:** tái dùng `runUnit`, `prefer` mềm của 0061, commit theo scope của 0060, test call-site sẵn có ở `test/architecture.test.mjs`, tham số `resolveWork` của `decide`. Thiếu trước đó: guard khoá việc xoá `dispatch execute <executor>` (lý do P3 phase 5 bỏ dở), lối vào `node` cho fanout, test doctrine chặn cửa cũ.
- **Ranh giới:** Component-boundary change: dispatch mất cửa thực thi và không còn phụ thuộc tầng Work; Work chỉ còn là bên dùng `runUnit`/dispatch.
- **Giới hạn đã biết:** caller ngoài repo gọi cửa đã xoá chỉ nhận lỗi chỉ đường (owner chấp nhận). Project khác giữ bản render dạy cửa cũ tới khi activate release mới và chạy `fgos setup`. Tài liệu người dùng (`docs/how-to`, `docs/reference`, how-to trong `docs/knowledge`) đã chuyển sang `fgos run`; tài liệu giải thích và bản ghi lịch sử (`docs/explanation`, why-* trong `docs/knowledge`, `docs/{platform,architect}/agent-coordination`) giữ nguyên lệnh cũ kèm ghi chú cửa đã xoá; `docs/history/**` và `plans/**` không sửa. Fanout và vòng loop chưa đi qua `runUnit`, nên `R3_PENDING_WORK_CALLERS` chưa rỗng.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_77e723624e1ae0a9c2e5e7e043fca4be

Source digest: 0b962f5518dcbbfad67bcb4760aaddc4ab2d54aec66968d3eb0812340e318d06

Target digest: 0b962f5518dcbbfad67bcb4760aaddc4ab2d54aec66968d3eb0812340e318d06

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-328",
  "sourceLines": [
    3302,
    3318
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work (thay phần purpose door của RUL68 (2 tầng dispatch) và phần \"mỗi cửa một lane posture\" của RUL77 (posture belongs to the capability))"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-187",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work (thay phần purpose door của RUL68 (2 tầng dispatch) và phần \"mỗi cửa một lane posture\" của RUL77 (posture belongs to the capability))"
  ],
  "nativeTargetClaimId": "claim_bc57f87c6271b0c3059a1a077dfd837d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_77e723624e1ae0a9c2e5e7e043fca4be",
    "sourceUnitDigest": "0b962f5518dcbbfad67bcb4760aaddc4ab2d54aec66968d3eb0812340e318d06",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-187",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-328 (lines 3302–3318) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-187. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0b962f5518dcbbfad67bcb4760aaddc4ab2d54aec66968d3eb0812340e318d06",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work (thay phần purpose door của RUL68 (2 tầng dispatch) và phần \"mỗi cửa một lane posture\" của RUL77 (posture belongs to the capability))"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay phần purpose door của RUL68 (2 tầng dispatch): `executeExecutorCli` không còn cửa CLI nào, là bước transport của Assignment (caller còn lại `fanout-batch.mjs` nằm trong `R3_PENDING_WORK_CALLERS` tới khi fanout chạy qua `runUnit`); tầng Assignment có lease/fallback giữ nguyên. Thay phần "each door carries one posture lane" của RUL77 (posture belongs to the capability); phần "agent executor không khai `for`, `for` của nó inert" giữ nguyên.
- **Bối cảnh:** Sau M1 đã có hai cửa trên một `runUnit` (one-liner `fgos run "<prompt>"`, `fgos workflow start --units`; 0060, 0061), nhưng cửa thô vẫn sống: `dispatch execute` theo executor id, dạng `--contract` và dạng `--assignment`, cùng `dispatch log` và `dispatch fanout-batch`. Mỗi cửa mang một lane posture riêng (RUL77 (posture belongs to the capability)), nên doctrine dạy ba đường cho cùng một việc, và việc đọc qua `--contract` giữ provider nhưng không sandbox. P3 phase 5 đã định xoá `dispatch execute <executor>` (`ad9a23a9f`) nhưng tiêu chí xong không kiểm việc đó nên bị bỏ dở. Owner quyết xoá (quyết định 4 của owner, đầu vào của hội đồng mở lại r4).
- **Quyết định:**
  1. **Xoá cửa thô** (RUL90 (the raw dispatch doors are removed)): `dispatch execute` (theo executor id, `--contract`, `--assignment`), `dispatch log`, `dispatch fanout-batch` và module `dispatch-log.mjs`. Gọi `dispatch execute` (mọi dạng) hoặc `dispatch log` trả lỗi `validation` gồm một câu chỉ đường, đặt ở một chỗ trong `bin` và tới được caller dạng `returnResult`: `execute` → `fgos run "<prompt>" [--provider <executor>] [--capability <c>] [--writes …]` hoặc `fgos run --unit` (chỉ ghi `--provider` khi executor là kind `agent`, vì `fgos run` từ chối kind khác; executor kind `tool` được bảo gọi thẳng tool; capability `--for` đã đăng ký được giữ; thông điệp BLOCKED của hook dựng cùng cách qua `runDoorHint`); `--assignment` → `fgos run --unit` hoặc Workflow; `dispatch log` → provenance nằm ở `.fgos/assignments/<unitRunId>/`.
  2. **Dispatch là tầng thấp:** `fgos dispatch` chỉ còn `decide`, `inspect`, `reconcile`, `probe-account`. `dispatch.mjs` không import tầng Work; `decide --work` nhận resolver Work tiêm từ `bin` (tham số `resolveWork` sẵn có), nên chỉ chạy qua `fgos dispatch decide --work`.
  3. **Posture lấy từ `writes` + capability, không từ cửa:** Unit không có `writes` chạy read-only có sandbox và lease account; có `writes` thì mutating trong linked worktree, runner commit theo scope (0060). Capability có required confinement vẫn áp. Provider cụ thể là `prefer` mềm (0061), không còn cửa nào ghim provider ngoài `--override` của người.
  4. **Fanout về tầng Work, không thêm verb:** lối vào `node src/runner/fanout-batch.mjs "<ids>" [--has-live-task-access]`, khoá output ổn định `fired`, `mechanismChanged`, `unavailable`, `deferred` (cộng `slotsFull: true` khi hết slot). Bảng route Rust không đổi. Phần ruột chuyển sang `runUnit` khi cắt Work; shape của từng phần tử `fired` chốt ở bước đó.
  5. **Guard khoá việc xoá:** guard import mở rộng tới `dispatch.mjs` và `src/workflow/**`, không allowlist; guard import đi bắc cầu qua import tương đối (re-export cách nhiều bước vẫn tính), đọc cả `require()` và `import()` literal; guard call-site quét `src`, `bin`, `scripts`, `domains`, `core`, ghi đích danh file được gọi `executeAssignment`, `executeExecutorCli`, `commitUnitWork`, `executeThroughConfinement` (import alias, destructure, namespace đều tính là gọi; `export *` từ module nhà của chúng bị từ chối); caller tầng Work chưa chuyển nằm trong `R3_PENDING_WORK_CALLERS` và phải về rỗng khi cắt Work xong.
  6. **Doctrine một nguồn:** `AGENTS.md` và mọi skill (nguồn `core/skills`, `domains/**`, render `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`) dạy `fgos run`; `test/docs/run-doors-doctrine.test.mjs` từ chối mọi bề mặt còn dạy `dispatch execute`/`log`/`fanout-batch`, `--contract` hay `decide --work` qua `node`.
- **RUL81 (`--contract` có sandbox, chỉ trên nhánh `fix/dispatch-followups`) chưa từng vào main.** Nó chỉ có trên nhánh `fix/dispatch-followups` (`af132275b`: `--contract` cộng `--for <capability confined>`, `contractPostureBinding`); owner bỏ merge nhánh đó (r4 quyết định 4), lane gom đánh lại hai quy tắc của lane ghi thành RUL82 (`RunResult.confinement` names the backend that ran) và RUL83 (a snapshot names what changed, never who), để trống số 81. 0062 không thay quy tắc nào mang số đó.
- **Dissent giữ lại (hội đồng r4):**
  - *Đo trước khi dựng cửa ngắn* (panelist-2: doctrine trước, đo, chỉ dựng khi cần; framing, panelist-1, panelist-3 muốn dựng ngay): owner bác bằng quyết định 4 cùng bằng chứng nhu cầu 19 lượt, **không bị bác bỏ về lý**. Rủi ro còn lại: không có số đếm caller ngoài repo của `dispatch execute <executor>` và `--assignment`; giảm thiểu bằng lỗi chỉ đường.
  - *Hình dạng confinement cho việc chỉ ghi docs* vẫn để mở: framing/panelist-1 muốn posture thứ ba có tên qua `bind()`; panelist-2 muốn allowlist theo capability, fail closed lúc ghi; panelist-3 muốn không bwrap subpath, dùng worktree + kiểm scope. RUL85 (the runner commits only the write scope) chỉ hiện thực biến thể quan sát-rồi-commit của panelist-3; chưa phương án nào được chứng minh.
- **Tái dùng / thiếu:** tái dùng `runUnit`, `prefer` mềm của 0061, commit theo scope của 0060, test call-site sẵn có ở `test/architecture.test.mjs`, tham số `resolveWork` của `decide`. Thiếu trước đó: guard khoá việc xoá `dispatch execute <executor>` (lý do P3 phase 5 bỏ dở), lối vào `node` cho fanout, test doctrine chặn cửa cũ.
- **Ranh giới:** Component-boundary change: dispatch mất cửa thực thi và không còn phụ thuộc tầng Work; Work chỉ còn là bên dùng `runUnit`/dispatch.
- **Giới hạn đã biết:** caller ngoài repo gọi cửa đã xoá chỉ nhận lỗi chỉ đường (owner chấp nhận). Project khác giữ bản render dạy cửa cũ tới khi activate release mới và chạy `fgos setup`. Tài liệu người dùng (`docs/how-to`, `docs/reference`, how-to trong `docs/knowledge`) đã chuyển sang `fgos run`; tài liệu giải thích và bản ghi lịch sử (`docs/explanation`, why-* trong `docs/knowledge`, `docs/{platform,architect}/agent-coordination`) giữ nguyên lệnh cũ kèm ghi chú cửa đã xoá; `docs/history/**` và `plans/**` không sửa. Fanout và vòng loop chưa đi qua `runUnit`, nên `R3_PENDING_WORK_CALLERS` chưa rỗng.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay phần purpose door của RUL68 (2 tầng dispatch): `executeExecutorCli` không còn cửa CLI nào, là bước transport của Assignment (caller còn lại `fanout-batch.mjs` nằm trong `R3_PENDING_WORK_CALLERS` tới khi fanout chạy qua `runUnit`); tầng Assignment có lease/fallback giữ nguyên. Thay phần "each door carries one posture lane" của RUL77 (posture belongs to the capability); phần "agent executor không khai `for`, `for` của nó inert" giữ nguyên.
- **Bối cảnh:** Sau M1 đã có hai cửa trên một `runUnit` (one-liner `fgos run "<prompt>"`, `fgos workflow start --units`; 0060, 0061), nhưng cửa thô vẫn sống: `dispatch execute` theo executor id, dạng `--contract` và dạng `--assignment`, cùng `dispatch log` và `dispatch fanout-batch`. Mỗi cửa mang một lane posture riêng (RUL77 (posture belongs to the capability)), nên doctrine dạy ba đường cho cùng một việc, và việc đọc qua `--contract` giữ provider nhưng không sandbox. P3 phase 5 đã định xoá `dispatch execute <executor>` (`ad9a23a9f`) nhưng tiêu chí xong không kiểm việc đó nên bị bỏ dở. Owner quyết xoá (quyết định 4 của owner, đầu vào của hội đồng mở lại r4).
- **Quyết định:**
  1. **Xoá cửa thô** (RUL90 (the raw dispatch doors are removed)): `dispatch execute` (theo executor id, `--contract`, `--assignment`), `dispatch log`, `dispatch fanout-batch` và module `dispatch-log.mjs`. Gọi `dispatch execute` (mọi dạng) hoặc `dispatch log` trả lỗi `validation` gồm một câu chỉ đường, đặt ở một chỗ trong `bin` và tới được caller dạng `returnResult`: `execute` → `fgos run "<prompt>" [--provider <executor>] [--capability <c>] [--writes …]` hoặc `fgos run --unit` (chỉ ghi `--provider` khi executor là kind `agent`, vì `fgos run` từ chối kind khác; executor kind `tool` được bảo gọi thẳng tool; capability `--for` đã đăng ký được giữ; thông điệp BLOCKED của hook dựng cùng cách qua `runDoorHint`); `--assignment` → `fgos run --unit` hoặc Workflow; `dispatch log` → provenance nằm ở `.fgos/assignments/<unitRunId>/`.
  2. **Dispatch là tầng thấp:** `fgos dispatch` chỉ còn `decide`, `inspect`, `reconcile`, `probe-account`. `dispatch.mjs` không import tầng Work; `decide --work` nhận resolver Work tiêm từ `bin` (tham số `resolveWork` sẵn có), nên chỉ chạy qua `fgos dispatch decide --work`.
  3. **Posture lấy từ `writes` + capability, không từ cửa:** Unit không có `writes` chạy read-only có sandbox và lease account; có `writes` thì mutating trong linked worktree, runner commit theo scope (0060). Capability có required confinement vẫn áp. Provider cụ thể là `prefer` mềm (0061), không còn cửa nào ghim provider ngoài `--override` của người.
  4. **Fanout về tầng Work, không thêm verb:** lối vào `node src/runner/fanout-batch.mjs "<ids>" [--has-live-task-access]`, khoá output ổn định `fired`, `mechanismChanged`, `unavailable`, `deferred` (cộng `slotsFull: true` khi hết slot). Bảng route Rust không đổi. Phần ruột chuyển sang `runUnit` khi cắt Work; shape của từng phần tử `fired` chốt ở bước đó.
  5. **Guard khoá việc xoá:** guard import mở rộng tới `dispatch.mjs` và `src/workflow/**`, không allowlist; guard import đi bắc cầu qua import tương đối (re-export cách nhiều bước vẫn tính), đọc cả `require()` và `import()` literal; guard call-site quét `src`, `bin`, `scripts`, `domains`, `core`, ghi đích danh file được gọi `executeAssignment`, `executeExecutorCli`, `commitUnitWork`, `executeThroughConfinement` (import alias, destructure, namespace đều tính là gọi; `export *` từ module nhà của chúng bị từ chối); caller tầng Work chưa chuyển nằm trong `R3_PENDING_WORK_CALLERS` và phải về rỗng khi cắt Work xong.
  6. **Doctrine một nguồn:** `AGENTS.md` và mọi skill (nguồn `core/skills`, `domains/**`, render `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`) dạy `fgos run`; `test/docs/run-doors-doctrine.test.mjs` từ chối mọi bề mặt còn dạy `dispatch execute`/`log`/`fanout-batch`, `--contract` hay `decide --work` qua `node`.
- **RUL81 (`--contract` có sandbox, chỉ trên nhánh `fix/dispatch-followups`) chưa từng vào main.** Nó chỉ có trên nhánh `fix/dispatch-followups` (`af132275b`: `--contract` cộng `--for <capability confined>`, `contractPostureBinding`); owner bỏ merge nhánh đó (r4 quyết định 4), lane gom đánh lại hai quy tắc của lane ghi thành RUL82 (`RunResult.confinement` names the backend that ran) và RUL83 (a snapshot names what changed, never who), để trống số 81. 0062 không thay quy tắc nào mang số đó.
- **Dissent giữ lại (hội đồng r4):**
  - *Đo trước khi dựng cửa ngắn* (panelist-2: doctrine trước, đo, chỉ dựng khi cần; framing, panelist-1, panelist-3 muốn dựng ngay): owner bác bằng quyết định 4 cùng bằng chứng nhu cầu 19 lượt, **không bị bác bỏ về lý**. Rủi ro còn lại: không có số đếm caller ngoài repo của `dispatch execute <executor>` và `--assignment`; giảm thiểu bằng lỗi chỉ đường.
  - *Hình dạng confinement cho việc chỉ ghi docs* vẫn để mở: framing/panelist-1 muốn posture thứ ba có tên qua `bind()`; panelist-2 muốn allowlist theo capability, fail closed lúc ghi; panelist-3 muốn không bwrap subpath, dùng worktree + kiểm scope. RUL85 (the runner commits only the write scope) chỉ hiện thực biến thể quan sát-rồi-commit của panelist-3; chưa phương án nào được chứng minh.
- **Tái dùng / thiếu:** tái dùng `runUnit`, `prefer` mềm của 0061, commit theo scope của 0060, test call-site sẵn có ở `test/architecture.test.mjs`, tham số `resolveWork` của `decide`. Thiếu trước đó: guard khoá việc xoá `dispatch execute <executor>` (lý do P3 phase 5 bỏ dở), lối vào `node` cho fanout, test doctrine chặn cửa cũ.
- **Ranh giới:** Component-boundary change: dispatch mất cửa thực thi và không còn phụ thuộc tầng Work; Work chỉ còn là bên dùng `runUnit`/dispatch.
- **Giới hạn đã biết:** caller ngoài repo gọi cửa đã xoá chỉ nhận lỗi chỉ đường (owner chấp nhận). Project khác giữ bản render dạy cửa cũ tới khi activate release mới và chạy `fgos setup`. Tài liệu người dùng (`docs/how-to`, `docs/reference`, how-to trong `docs/knowledge`) đã chuyển sang `fgos run`; tài liệu giải thích và bản ghi lịch sử (`docs/explanation`, why-* trong `docs/knowledge`, `docs/{platform,architect}/agent-coordination`) giữ nguyên lệnh cũ kèm ghi chú cửa đã xoá; `docs/history/**` và `plans/**` không sửa. Fanout và vòng loop chưa đi qua `runUnit`, nên `R3_PENDING_WORK_CALLERS` chưa rỗng.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_5788dd19c4378fbb442c6a455f0e7857

Source digest: 29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9

Target digest: 29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
  "sourceLines": [
    3320,
    3320
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_a13ffcee98032a026d0b53ee92959c8b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2 (lines 3320–3320) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)

- **Trạng thái:** Settled (2026-10-14). Thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2: dispatch thôi nhận object Work (`work`, `workItem`) hay `workExecutorId` rời; RUL95 (dispatch takes generic inputs only). Đóng danh sách `R3_PENDING_WORK_CALLERS` của RUL90 (the raw dispatch doors are removed) và câu để ngỏ về `import()` không literal ở đó.
- **Bối cảnh:** Sau RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each) và RUL94 (a Work driver step runs as a Unit), không caller production nào còn gọi thẳng cửa chạy của dispatch, nhưng dispatch vẫn giữ các tham số Work: `buildAssignment({work})` tự suy `contextRefs` từ `docsRef`/`refs`; policy đọc `work.rigor`/`work.risk`/`work.domain`; `compileDispatchPlan` nhận `workItem` (fan-out còn truyền cả object item); `executeExecutorCli({work})` cho chạy executor chưa đăng ký khi có item đi kèm; `assignment.mjs` tự dò và `import()` harness của domain ở `domains/<d>/harness/` — guard import không thấy đường này (R4b của lane cắt cửa). Một caller truyền `work` vào dispatch bị bỏ qua trong im lặng, nên rigor của item có thể mất mà không ai biết. Thêm nữa, từ RUL94 (a Work driver step runs as a Unit), seat của bước driver mang `domain` mà policy không đọc, nên sàn `<domain>:review` bị mất.
- **Quyết định:**
  1. Rigor và domain là trường của chính assignment (`assignment.rigor`, `assignment.domain`). Tầng Work gộp `rigor` và `risk: heavy` của item thành một rigor (`workRigorFor`); luật đơn điệu ở lại dispatch: nguồn tường minh đầu tiên được chọn, nguồn sau chỉ nâng, sàn capability và luật tier giữ nguyên.
  2. `decide --work` và fan-out nhận hint `{workExecutorId, agentType, rigor?, domain?}` từ tầng Work (`workDispatchHint`); khoá `--work` trong API là `workId`. `workDispatchContext` chỉ trả `capabilityHints`, `agentType`.
  3. Các cửa dispatch từ chối `work`/`workItem`/`workExecutorId` thay vì bỏ qua.
  4. Harness của domain chỉ tầng Work được nạp (`domainHarnessFor`, chỉ domain đã đăng ký, ở bước đã khai); caller truyền vào `buildAssignment` inline qua `options.domainHarness`; dispatch vẫn kiểm lại contract sau seam. Hiện chưa có đường production nào dựng assignment inline cho một Work item (trước đây cũng không: caller inline duy nhất là `probe-account`), nên seam chỉ chạy trong test; giữ lại vì ADR-007 là quyết định riêng, bỏ seam phải supersede ADR đó.
  5. Guard ngữ nghĩa: không định danh/thuộc tính `work`, `workItem`, `docsRef` (giải mã escape trước), không chuỗi đúng bằng các tên đó ngoài chỗ được ghim, không `resolveContentRoot(` trong tập canh gác; `src/state/**` tính là tầng Work (một cạnh `StoreError` được ghim); thư mục canh gác chỉ chứa `.mjs` thường; lexer chung coi `/` sau `}` đóng khối là regex; không nạp code theo tên tính lúc chạy (`import()`/`require()` không literal, `createRequire`, `eval`, `Function(...)`, `module`/`vm`/`worker_threads`) ngoài các lần nạp được ghim từng cái trong allowlist đích danh có lý do. Guard call-site so bằng equality với danh sách caller tuyệt đối; `R3_PENDING_WORK_CALLERS` đã xoá.
- **Cổng R3 đã đạt:** `rg -n R3_PENDING_WORK_CALLERS test` ra 0; guard call-site tuyệt đối, guard import, guard ngữ nghĩa và guard nạp động xanh trên nhánh `feat/rununit-guard` (commit `fc9cc6fb9`); trên `src/` của main các guard mới đỏ đúng các dòng trong kiểm kê (47 dòng Work-shaped ở `assignment.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `cli.mjs`, `plan.mjs`, cộng `assignment.mjs:99` nạp harness theo đường tính). Bằng chứng chạy: `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`.
- **Tái dùng / thiếu:** tái dùng `workRigorFor` (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), `executorIdForWork`, `lexSource` của test, guard import bắc cầu và guard call-site của 0062. Thiếu trước đó: hint generic cho `decide --work`, cách truyền harness từ caller, guard ngữ nghĩa, guard nạp động.
- **Ranh giới:** Component-boundary change: dispatch không còn nhận dữ liệu Work dưới bất kỳ dạng nào; harness domain chuyển từ dispatch sang tầng Work.
- **Lệch so với thiết kế R3 đã duyệt (mục 5):** hint không mang `capabilityHints`/`stage` vì không bên nào ở `decide` đọc chúng (YAGNI); provenance rigor ghi scope `assignment` (trường chung của assignment) thay cho `work-hint`.
- **Giới hạn đã biết:** guard đọc văn bản, không có parser JS (repo chỉ có dependency `yaml`): tên dựng lúc chạy (`opts[k]`, `'wo' + 'rk'`), input lồng (`options.work`, `assignment.work`; không ai đọc) và code ngoài tập canh gác tự với vào nội bộ dispatch không bị bắt. `StoreError` nằm trong `src/state/store.mjs` nên module runner dùng chung vẫn nạp store; tách nó là việc riêng. Assignment cũ trên đĩa không có `rigor` ở cấp ngoài; assignment declared cũ thì luôn có `domain`, nên nếu config khai rigor cho capability `<domain>:review`, sàn đó nay áp cho chúng (chỉ nâng; registry mặc định không khai). Rigor sai định dạng trên item cũ (trước khi store kiểm) được hint chuyển nguyên cho dispatch tự xét, như khi dispatch còn đọc field của item.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
### 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)

- **Trạng thái:** Settled (2026-10-14). Thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2: dispatch thôi nhận object Work (`work`, `workItem`) hay `workExecutorId` rời; RUL95 (dispatch takes generic inputs only). Đóng danh sách `R3_PENDING_WORK_CALLERS` của RUL90 (the raw dispatch doors are removed) và câu để ngỏ về `import()` không literal ở đó.
- **Bối cảnh:** Sau RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each) và RUL94 (a Work driver step runs as a Unit), không caller production nào còn gọi thẳng cửa chạy của dispatch, nhưng dispatch vẫn giữ các tham số Work: `buildAssignment({work})` tự suy `contextRefs` từ `docsRef`/`refs`; policy đọc `work.rigor`/`work.risk`/`work.domain`; `compileDispatchPlan` nhận `workItem` (fan-out còn truyền cả object item); `executeExecutorCli({work})` cho chạy executor chưa đăng ký khi có item đi kèm; `assignment.mjs` tự dò và `import()` harness của domain ở `domains/<d>/harness/` — guard import không thấy đường này (R4b của lane cắt cửa). Một caller truyền `work` vào dispatch bị bỏ qua trong im lặng, nên rigor của item có thể mất mà không ai biết. Thêm nữa, từ RUL94 (a Work driver step runs as a Unit), seat của bước driver mang `domain` mà policy không đọc, nên sàn `<domain>:review` bị mất.
- **Quyết định:**
  1. Rigor và domain là trường của chính assignment (`assignment.rigor`, `assignment.domain`). Tầng Work gộp `rigor` và `risk: heavy` của item thành một rigor (`workRigorFor`); luật đơn điệu ở lại dispatch: nguồn tường minh đầu tiên được chọn, nguồn sau chỉ nâng, sàn capability và luật tier giữ nguyên.
  2. `decide --work` và fan-out nhận hint `{workExecutorId, agentType, rigor?, domain?}` từ tầng Work (`workDispatchHint`); khoá `--work` trong API là `workId`. `workDispatchContext` chỉ trả `capabilityHints`, `agentType`.
  3. Các cửa dispatch từ chối `work`/`workItem`/`workExecutorId` thay vì bỏ qua.
  4. Harness của domain chỉ tầng Work được nạp (`domainHarnessFor`, chỉ domain đã đăng ký, ở bước đã khai); caller truyền vào `buildAssignment` inline qua `options.domainHarness`; dispatch vẫn kiểm lại contract sau seam. Hiện chưa có đường production nào dựng assignment inline cho một Work item (trước đây cũng không: caller inline duy nhất là `probe-account`), nên seam chỉ chạy trong test; giữ lại vì ADR-007 là quyết định riêng, bỏ seam phải supersede ADR đó.
  5. Guard ngữ nghĩa: không định danh/thuộc tính `work`, `workItem`, `docsRef` (giải mã escape trước), không chuỗi đúng bằng các tên đó ngoài chỗ được ghim, không `resolveContentRoot(` trong tập canh gác; `src/state/**` tính là tầng Work (một cạnh `StoreError` được ghim); thư mục canh gác chỉ chứa `.mjs` thường; lexer chung coi `/` sau `}` đóng khối là regex; không nạp code theo tên tính lúc chạy (`import()`/`require()` không literal, `createRequire`, `eval`, `Function(...)`, `module`/`vm`/`worker_threads`) ngoài các lần nạp được ghim từng cái trong allowlist đích danh có lý do. Guard call-site so bằng equality với danh sách caller tuyệt đối; `R3_PENDING_WORK_CALLERS` đã xoá.
- **Cổng R3 đã đạt:** `rg -n R3_PENDING_WORK_CALLERS test` ra 0; guard call-site tuyệt đối, guard import, guard ngữ nghĩa và guard nạp động xanh trên nhánh `feat/rununit-guard` (commit `fc9cc6fb9`); trên `src/` của main các guard mới đỏ đúng các dòng trong kiểm kê (47 dòng Work-shaped ở `assignment.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `cli.mjs`, `plan.mjs`, cộng `assignment.mjs:99` nạp harness theo đường tính). Bằng chứng chạy: `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`.
- **Tái dùng / thiếu:** tái dùng `workRigorFor` (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), `executorIdForWork`, `lexSource` của test, guard import bắc cầu và guard call-site của 0062. Thiếu trước đó: hint generic cho `decide --work`, cách truyền harness từ caller, guard ngữ nghĩa, guard nạp động.
- **Ranh giới:** Component-boundary change: dispatch không còn nhận dữ liệu Work dưới bất kỳ dạng nào; harness domain chuyển từ dispatch sang tầng Work.
- **Lệch so với thiết kế R3 đã duyệt (mục 5):** hint không mang `capabilityHints`/`stage` vì không bên nào ở `decide` đọc chúng (YAGNI); provenance rigor ghi scope `assignment` (trường chung của assignment) thay cho `work-hint`.
- **Giới hạn đã biết:** guard đọc văn bản, không có parser JS (repo chỉ có dependency `yaml`): tên dựng lúc chạy (`opts[k]`, `'wo' + 'rk'`), input lồng (`options.work`, `assignment.work`; không ai đọc) và code ngoài tập canh gác tự với vào nội bộ dispatch không bị bắt. `StoreError` nằm trong `src/state/store.mjs` nên module runner dùng chung vẫn nạp store; tách nó là việc riêng. Assignment cũ trên đĩa không có `rigor` ở cấp ngoài; assignment declared cũ thì luôn có `domain`, nên nếu config khai rigor cho capability `<domain>:review`, sàn đó nay áp cho chúng (chỉ nâng; registry mặc định không khai). Rigor sai định dạng trên item cũ (trước khi store kiểm) được hint chuyển nguyên cho dispatch tự xét, như khi dispatch còn đọc field của item.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_6eb47bc2e3c271b4af46b09fc2c4e90c

Source digest: 61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97

Target digest: 61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-329",
  "sourceLines": [
    3322,
    3335
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-188",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)"
  ],
  "nativeTargetClaimId": "claim_db0d6d6c2311e818ff37b225039818f7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
  "mapAmendments": [
    {
      "source": "docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
      "target": "docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
      "kind": "decision",
      "operation": "split",
      "note": "Added in candidate — P2, explicit Lead map-growth decision at sync 63fa6f15266f45c881f610235e0be8d61ff07120. Direct units only; source heading verbatim, including partial-supersession suffixes. Placement under the source retired-history heading is not a retirement judgment. Source blob: `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`."
    }
  ],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6eb47bc2e3c271b4af46b09fc2c4e90c",
    "sourceUnitDigest": "61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-188",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-329 (lines 3322–3335) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-188. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "61e128436645d5127c2050899a6e209b13206523fe4a641557c4277ffda23d97",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2)"
    ]
  }
}
```

### Full source unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2: dispatch thôi nhận object Work (`work`, `workItem`) hay `workExecutorId` rời; RUL95 (dispatch takes generic inputs only). Đóng danh sách `R3_PENDING_WORK_CALLERS` của RUL90 (the raw dispatch doors are removed) và câu để ngỏ về `import()` không literal ở đó.
- **Bối cảnh:** Sau RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each) và RUL94 (a Work driver step runs as a Unit), không caller production nào còn gọi thẳng cửa chạy của dispatch, nhưng dispatch vẫn giữ các tham số Work: `buildAssignment({work})` tự suy `contextRefs` từ `docsRef`/`refs`; policy đọc `work.rigor`/`work.risk`/`work.domain`; `compileDispatchPlan` nhận `workItem` (fan-out còn truyền cả object item); `executeExecutorCli({work})` cho chạy executor chưa đăng ký khi có item đi kèm; `assignment.mjs` tự dò và `import()` harness của domain ở `domains/<d>/harness/` — guard import không thấy đường này (R4b của lane cắt cửa). Một caller truyền `work` vào dispatch bị bỏ qua trong im lặng, nên rigor của item có thể mất mà không ai biết. Thêm nữa, từ RUL94 (a Work driver step runs as a Unit), seat của bước driver mang `domain` mà policy không đọc, nên sàn `<domain>:review` bị mất.
- **Quyết định:**
  1. Rigor và domain là trường của chính assignment (`assignment.rigor`, `assignment.domain`). Tầng Work gộp `rigor` và `risk: heavy` của item thành một rigor (`workRigorFor`); luật đơn điệu ở lại dispatch: nguồn tường minh đầu tiên được chọn, nguồn sau chỉ nâng, sàn capability và luật tier giữ nguyên.
  2. `decide --work` và fan-out nhận hint `{workExecutorId, agentType, rigor?, domain?}` từ tầng Work (`workDispatchHint`); khoá `--work` trong API là `workId`. `workDispatchContext` chỉ trả `capabilityHints`, `agentType`.
  3. Các cửa dispatch từ chối `work`/`workItem`/`workExecutorId` thay vì bỏ qua.
  4. Harness của domain chỉ tầng Work được nạp (`domainHarnessFor`, chỉ domain đã đăng ký, ở bước đã khai); caller truyền vào `buildAssignment` inline qua `options.domainHarness`; dispatch vẫn kiểm lại contract sau seam. Hiện chưa có đường production nào dựng assignment inline cho một Work item (trước đây cũng không: caller inline duy nhất là `probe-account`), nên seam chỉ chạy trong test; giữ lại vì ADR-007 là quyết định riêng, bỏ seam phải supersede ADR đó.
  5. Guard ngữ nghĩa: không định danh/thuộc tính `work`, `workItem`, `docsRef` (giải mã escape trước), không chuỗi đúng bằng các tên đó ngoài chỗ được ghim, không `resolveContentRoot(` trong tập canh gác; `src/state/**` tính là tầng Work (một cạnh `StoreError` được ghim); thư mục canh gác chỉ chứa `.mjs` thường; lexer chung coi `/` sau `}` đóng khối là regex; không nạp code theo tên tính lúc chạy (`import()`/`require()` không literal, `createRequire`, `eval`, `Function(...)`, `module`/`vm`/`worker_threads`) ngoài các lần nạp được ghim từng cái trong allowlist đích danh có lý do. Guard call-site so bằng equality với danh sách caller tuyệt đối; `R3_PENDING_WORK_CALLERS` đã xoá.
- **Cổng R3 đã đạt:** `rg -n R3_PENDING_WORK_CALLERS test` ra 0; guard call-site tuyệt đối, guard import, guard ngữ nghĩa và guard nạp động xanh trên nhánh `feat/rununit-guard` (commit `fc9cc6fb9`); trên `src/` của main các guard mới đỏ đúng các dòng trong kiểm kê (47 dòng Work-shaped ở `assignment.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `cli.mjs`, `plan.mjs`, cộng `assignment.mjs:99` nạp harness theo đường tính). Bằng chứng chạy: `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`.
- **Tái dùng / thiếu:** tái dùng `workRigorFor` (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), `executorIdForWork`, `lexSource` của test, guard import bắc cầu và guard call-site của 0062. Thiếu trước đó: hint generic cho `decide --work`, cách truyền harness từ caller, guard ngữ nghĩa, guard nạp động.
- **Ranh giới:** Component-boundary change: dispatch không còn nhận dữ liệu Work dưới bất kỳ dạng nào; harness domain chuyển từ dispatch sang tầng Work.
- **Lệch so với thiết kế R3 đã duyệt (mục 5):** hint không mang `capabilityHints`/`stage` vì không bên nào ở `decide` đọc chúng (YAGNI); provenance rigor ghi scope `assignment` (trường chung của assignment) thay cho `work-hint`.
- **Giới hạn đã biết:** guard đọc văn bản, không có parser JS (repo chỉ có dependency `yaml`): tên dựng lúc chạy (`opts[k]`, `'wo' + 'rk'`), input lồng (`options.work`, `assignment.work`; không ai đọc) và code ngoài tập canh gác tự với vào nội bộ dispatch không bị bắt. `StoreError` nằm trong `src/state/store.mjs` nên module runner dùng chung vẫn nạp store; tách nó là việc riêng. Assignment cũ trên đĩa không có `rigor` ở cấp ngoài; assignment declared cũ thì luôn có `domain`, nên nếu config khai rigor cho capability `<domain>:review`, sàn đó nay áp cho chúng (chỉ nâng; registry mặc định không khai). Rigor sai định dạng trên item cũ (trước khi store kiểm) được hint chuyển nguyên cho dispatch tự xét, như khi dispatch còn đọc field của item.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
- **Trạng thái:** Settled (2026-10-14). Thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2: dispatch thôi nhận object Work (`work`, `workItem`) hay `workExecutorId` rời; RUL95 (dispatch takes generic inputs only). Đóng danh sách `R3_PENDING_WORK_CALLERS` của RUL90 (the raw dispatch doors are removed) và câu để ngỏ về `import()` không literal ở đó.
- **Bối cảnh:** Sau RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each) và RUL94 (a Work driver step runs as a Unit), không caller production nào còn gọi thẳng cửa chạy của dispatch, nhưng dispatch vẫn giữ các tham số Work: `buildAssignment({work})` tự suy `contextRefs` từ `docsRef`/`refs`; policy đọc `work.rigor`/`work.risk`/`work.domain`; `compileDispatchPlan` nhận `workItem` (fan-out còn truyền cả object item); `executeExecutorCli({work})` cho chạy executor chưa đăng ký khi có item đi kèm; `assignment.mjs` tự dò và `import()` harness của domain ở `domains/<d>/harness/` — guard import không thấy đường này (R4b của lane cắt cửa). Một caller truyền `work` vào dispatch bị bỏ qua trong im lặng, nên rigor của item có thể mất mà không ai biết. Thêm nữa, từ RUL94 (a Work driver step runs as a Unit), seat của bước driver mang `domain` mà policy không đọc, nên sàn `<domain>:review` bị mất.
- **Quyết định:**
  1. Rigor và domain là trường của chính assignment (`assignment.rigor`, `assignment.domain`). Tầng Work gộp `rigor` và `risk: heavy` của item thành một rigor (`workRigorFor`); luật đơn điệu ở lại dispatch: nguồn tường minh đầu tiên được chọn, nguồn sau chỉ nâng, sàn capability và luật tier giữ nguyên.
  2. `decide --work` và fan-out nhận hint `{workExecutorId, agentType, rigor?, domain?}` từ tầng Work (`workDispatchHint`); khoá `--work` trong API là `workId`. `workDispatchContext` chỉ trả `capabilityHints`, `agentType`.
  3. Các cửa dispatch từ chối `work`/`workItem`/`workExecutorId` thay vì bỏ qua.
  4. Harness của domain chỉ tầng Work được nạp (`domainHarnessFor`, chỉ domain đã đăng ký, ở bước đã khai); caller truyền vào `buildAssignment` inline qua `options.domainHarness`; dispatch vẫn kiểm lại contract sau seam. Hiện chưa có đường production nào dựng assignment inline cho một Work item (trước đây cũng không: caller inline duy nhất là `probe-account`), nên seam chỉ chạy trong test; giữ lại vì ADR-007 là quyết định riêng, bỏ seam phải supersede ADR đó.
  5. Guard ngữ nghĩa: không định danh/thuộc tính `work`, `workItem`, `docsRef` (giải mã escape trước), không chuỗi đúng bằng các tên đó ngoài chỗ được ghim, không `resolveContentRoot(` trong tập canh gác; `src/state/**` tính là tầng Work (một cạnh `StoreError` được ghim); thư mục canh gác chỉ chứa `.mjs` thường; lexer chung coi `/` sau `}` đóng khối là regex; không nạp code theo tên tính lúc chạy (`import()`/`require()` không literal, `createRequire`, `eval`, `Function(...)`, `module`/`vm`/`worker_threads`) ngoài các lần nạp được ghim từng cái trong allowlist đích danh có lý do. Guard call-site so bằng equality với danh sách caller tuyệt đối; `R3_PENDING_WORK_CALLERS` đã xoá.
- **Cổng R3 đã đạt:** `rg -n R3_PENDING_WORK_CALLERS test` ra 0; guard call-site tuyệt đối, guard import, guard ngữ nghĩa và guard nạp động xanh trên nhánh `feat/rununit-guard` (commit `fc9cc6fb9`); trên `src/` của main các guard mới đỏ đúng các dòng trong kiểm kê (47 dòng Work-shaped ở `assignment.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `cli.mjs`, `plan.mjs`, cộng `assignment.mjs:99` nạp harness theo đường tính). Bằng chứng chạy: `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`.
- **Tái dùng / thiếu:** tái dùng `workRigorFor` (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), `executorIdForWork`, `lexSource` của test, guard import bắc cầu và guard call-site của 0062. Thiếu trước đó: hint generic cho `decide --work`, cách truyền harness từ caller, guard ngữ nghĩa, guard nạp động.
- **Ranh giới:** Component-boundary change: dispatch không còn nhận dữ liệu Work dưới bất kỳ dạng nào; harness domain chuyển từ dispatch sang tầng Work.
- **Lệch so với thiết kế R3 đã duyệt (mục 5):** hint không mang `capabilityHints`/`stage` vì không bên nào ở `decide` đọc chúng (YAGNI); provenance rigor ghi scope `assignment` (trường chung của assignment) thay cho `work-hint`.
- **Giới hạn đã biết:** guard đọc văn bản, không có parser JS (repo chỉ có dependency `yaml`): tên dựng lúc chạy (`opts[k]`, `'wo' + 'rk'`), input lồng (`options.work`, `assignment.work`; không ai đọc) và code ngoài tập canh gác tự với vào nội bộ dispatch không bị bắt. `StoreError` nằm trong `src/state/store.mjs` nên module runner dùng chung vẫn nạp store; tách nó là việc riêng. Assignment cũ trên đĩa không có `rigor` ở cấp ngoài; assignment declared cũ thì luôn có `domain`, nên nếu config khai rigor cho capability `<domain>:review`, sàn đó nay áp cho chúng (chỉ nâng; registry mặc định không khai). Rigor sai định dạng trên item cũ (trước khi store kiểm) được hint chuyển nguyên cho dispatch tự xét, như khi dispatch còn đọc field của item.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```
