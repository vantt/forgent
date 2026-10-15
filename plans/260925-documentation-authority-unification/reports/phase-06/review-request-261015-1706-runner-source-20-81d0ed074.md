# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **70**. Target: `docs/platform/runner/decisions/h-36d872fbb0e5.md`; part 2/5. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `4015d0b3bd19cc6be38c183d6b8fff49b70fdf99dc85331a1bf91b135ce2552c`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **11/70** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_e991f8dfb06ca966ca78f96b15566357",
      "claim_d5eb90c8adeb096822ac8d727dab7cd6",
      "claim_336e0302249c006e88efde8a4d27255e",
      "claim_e20450852b8cc81b71efd44e9774d4dc",
      "claim_9cf9f5275922a28d295ca75d7080371c",
      "claim_9121a224604fce68e66e2bf9877a4231",
      "claim_533802b60054f03ee6b48aea33340ecf",
      "claim_5f90a4f4debb0109bb2b0dadef12b6dc",
      "claim_6c453d9e400adf8c1bdadb6e6fb688f3",
      "claim_cbdb1b45324e09cc15d67abf3193f88a",
      "claim_eac67903478bf345629ba008d8a46d91",
      "claim_3eb8339e6534b30ba7e1214255a11800",
      "claim_6c5782d3c915607c1c05c83fb5ebd255",
      "claim_76fb7a95c77c1134d95835418caae508",
      "claim_ab17d2e0d5e4c02ee484af949c0ed6d9",
      "claim_e69c1ad0321ac1bab192b7b445e12c32",
      "claim_ea8cffbdab27d692943b9b21f17cff59",
      "claim_5d4011da92ecd1ef38890896ddec0b30",
      "claim_5e0493e873f065e86c03c915d2b9f47a",
      "claim_8e7177164c1170f64004f6394da10f28",
      "claim_ace313a6fdc22d289460ebc961626058",
      "claim_e1b08b2f6139de01967d11160e3596c7",
      "claim_f9464aa89f3ee921a37fdc007aa49b88",
      "claim_815885047389d9a4fdfb9d753114482a",
      "claim_cfcf01219968c9c43844432a9bf45106",
      "claim_61a2d3a97785a1fa8dfe590c11569dbb",
      "claim_65654a30d9d13cf2fbea182b95d19049",
      "claim_34f4766922b81e1632751f0946d57c19",
      "claim_191a42c1761f116fda00b3a25ca22d4c",
      "claim_1fea4b6f88d29b497e4695ae53ad21a5",
      "claim_82480fdae45d11c28fcfddadadcf6f8c",
      "claim_ac087152a043ed0200b3a7c9739c85e2",
      "claim_8417ee94f21d262eab9e492cb51ec9df",
      "claim_dcee9deff7058aad0cd965be27771490",
      "claim_3f39255d8460bbdb8d376bb58688db71",
      "claim_c23434061f64a68f921bd4659db03d4e",
      "claim_b8f3a6e00f6edc0c09f4761cd15afbb7",
      "claim_a7a07f60563e296d7b435b89f3889787",
      "claim_65786749887af84813c1f796c5a52d38",
      "claim_b6d8e91e3e324b46ed6e14a8f8b15350",
      "claim_ef0a060c997d60618ebf3ec333100265",
      "claim_e1d151ecdc8f72efa20cced4a6f3f581",
      "claim_2637ccffa0d84f079f80223b471ee1a6",
      "claim_39b334e5c7e4b4310d892cc365fb23ab",
      "claim_f55200ae800f55780d944d1b18a459c8",
      "claim_5ecb968b071f9bff993acfbb3fd36127",
      "claim_1a361f01db5a6e6a64ce5d65a0bfa934",
      "claim_94a01565f18c613f6e7502977d54e6ac",
      "claim_ba1ff7b7666e08aeca20821318df3132",
      "claim_9c4e625714d537e186cddc9ec62ae473",
      "claim_f461a9f790d3acb7c125568c286f05a4",
      "claim_d5143ddef51fde2e51f8743fa3e87b64",
      "claim_b1f4c90d19ab3249e717f89facdbde86",
      "claim_91f16f1801511650e3092f03db9a7c19",
      "claim_7482a6b245a0f7034787e7d8bd0b7d24",
      "claim_60fa2dd65b4761863bd7399ade02f9c6",
      "claim_f5f5082cfab9ed213a69e6329a943711",
      "claim_399a6a1ad4caf2bbe46bc11bc69083dc",
      "claim_8e13478f818abae09e212614ce693dd5",
      "claim_7ef4616208cde18e71e68840794ddc68",
      "claim_42c30fd183662e4169a2a222ae977402",
      "claim_e0885603b38fb62d780a5ab48de1269e",
      "claim_8d91631a900ec4103a5c2b0d5b989fc2",
      "claim_4698df498321c7999068e58b926bc2de",
      "claim_61d64e215a358590a29fd961d4859d04",
      "claim_9e03e34162628933345e9e0a920f11a0",
      "claim_da73abd735dca12fcb4d508d11f9f975",
      "claim_29551bf7cdd778fb08c7cd0565514abf",
      "claim_4434041dbcdebe16d090670b036ca41f",
      "claim_4e7c489e21608b903806cd5da65a1697"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_e991f8dfb06ca966ca78f96b15566357

Source digest: 0ef1161a7277126cde540e2316d3d5205f0f9625e2f1153621fa6751da9f9f23

Target digest: 0ef1161a7277126cde540e2316d3d5205f0f9625e2f1153621fa6751da9f9f23

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "sourceLines": [
    1946,
    1946
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
  ],
  "nativeTargetClaimId": "claim_4bed9432b5f60b3ae3067e923b5fe57c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e991f8dfb06ca966ca78f96b15566357",
    "sourceUnitDigest": "0ef1161a7277126cde540e2316d3d5205f0f9625e2f1153621fa6751da9f9f23",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve (lines 1946–1946) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0ef1161a7277126cde540e2316d3d5205f0f9625e2f1153621fa6751da9f9f23",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
    ]
  }
}
```

### Full source unit

```text
###### 2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`

Xác nhận lại tsk-63j với citation mới (file đã đổi dòng từ lúc ghi):

- `bin/fgos.mjs:98` định nghĩa `isWorkingTreeClean(cwd)` riêng cho `return`
  (gọi tại `bin/fgos.mjs:1428`) — chạy `git status --porcelain -- .`, chỉ
  soi subtree của `cwd`.
- `src/runner/merge.mjs:133` định nghĩa `isWorkingTreeClean(repoRoot)`
  riêng cho `approve` (import alias `isMainTreeClean` tại
  `bin/fgos.mjs:33`, gọi tại `bin/fgos.mjs:1714`) — chạy
  `git status --porcelain` không pathspec, soi TOÀN repo.

Cả hai dùng chung 1 helper loại trừ (`isFgosOnlyStatusLine`) nhưng hàm gác
chính thì viết riêng 2 lần, với khác biệt phạm vi thật (subtree vs
whole-repo) — không phải trùng tên ngẫu nhiên, là 2 implementation thật.

**Đã sửa** (item `choke-point-workingtree-clean-duplication`, commit
`3dad0c2`): hợp nhất về 1 hàm `isWorkingTreeClean(repoRoot, ownFileSet,
{ scope })` trong `src/runner/merge.mjs`, `scope` nhận `'subtree'` (return)
hoặc `'whole-repo'` (approve, mặc định) — cùng 1 lần tính `prefix`, cùng 1
lần loại trừ `.fgos/`. `bin/fgos.mjs`'s own `isWorkingTreeClean(cwd,
ownFileSet)` giờ chỉ delegate sang hàm trên với `scope: 'subtree'`.
```

### Full target unit

```text
###### 2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`

Xác nhận lại tsk-63j với citation mới (file đã đổi dòng từ lúc ghi):

- `bin/fgos.mjs:98` định nghĩa `isWorkingTreeClean(cwd)` riêng cho `return`
  (gọi tại `bin/fgos.mjs:1428`) — chạy `git status --porcelain -- .`, chỉ
  soi subtree của `cwd`.
- `src/runner/merge.mjs:133` định nghĩa `isWorkingTreeClean(repoRoot)`
  riêng cho `approve` (import alias `isMainTreeClean` tại
  `bin/fgos.mjs:33`, gọi tại `bin/fgos.mjs:1714`) — chạy
  `git status --porcelain` không pathspec, soi TOÀN repo.

Cả hai dùng chung 1 helper loại trừ (`isFgosOnlyStatusLine`) nhưng hàm gác
chính thì viết riêng 2 lần, với khác biệt phạm vi thật (subtree vs
whole-repo) — không phải trùng tên ngẫu nhiên, là 2 implementation thật.

**Đã sửa** (item `choke-point-workingtree-clean-duplication`, commit
`3dad0c2`): hợp nhất về 1 hàm `isWorkingTreeClean(repoRoot, ownFileSet,
{ scope })` trong `src/runner/merge.mjs`, `scope` nhận `'subtree'` (return)
hoặc `'whole-repo'` (approve, mặc định) — cùng 1 lần tính `prefix`, cùng 1
lần loại trừ `.fgos/`. `bin/fgos.mjs`'s own `isWorkingTreeClean(cwd,
ownFileSet)` giờ chỉ delegate sang hàm trên với `scope: 'subtree'`.
```

### Full diff

```diff
No text difference.
```

## claim_d5eb90c8adeb096822ac8d727dab7cd6

Source digest: f20686e278fabcd58d47dff5f9edf5f84f9acbc3633465b793a0a3ccff705e92

Target digest: f20686e278fabcd58d47dff5f9edf5f84f9acbc3633465b793a0a3ccff705e92

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-183",
  "sourceLines": [
    1948,
    1948
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-42",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "nativeTargetClaimId": "claim_609f440b4c8f750979aa9ed7c0cc1e2c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d5eb90c8adeb096822ac8d727dab7cd6",
    "sourceUnitDigest": "f20686e278fabcd58d47dff5f9edf5f84f9acbc3633465b793a0a3ccff705e92",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-183 (lines 1948–1948) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-42. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f20686e278fabcd58d47dff5f9edf5f84f9acbc3633465b793a0a3ccff705e92",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
    ]
  }
}
```

### Full source unit

```text
Xác nhận lại tsk-63j với citation mới (file đã đổi dòng từ lúc ghi):
```

### Full target unit

```text
Xác nhận lại tsk-63j với citation mới (file đã đổi dòng từ lúc ghi):
```

### Full diff

```diff
No text difference.
```

## claim_336e0302249c006e88efde8a4d27255e

Source digest: 263ef95a373f58632a030745c841947668dafb1a69e08e16d7b982a3ab89406d

Target digest: 263ef95a373f58632a030745c841947668dafb1a69e08e16d7b982a3ab89406d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-184",
  "sourceLines": [
    1950,
    1956
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-43",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "nativeTargetClaimId": "claim_f332aa60659352e159bb632369842e5c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_336e0302249c006e88efde8a4d27255e",
    "sourceUnitDigest": "263ef95a373f58632a030745c841947668dafb1a69e08e16d7b982a3ab89406d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-184 (lines 1950–1956) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-43. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "263ef95a373f58632a030745c841947668dafb1a69e08e16d7b982a3ab89406d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
    ]
  }
}
```

### Full source unit

```text
- `bin/fgos.mjs:98` định nghĩa `isWorkingTreeClean(cwd)` riêng cho `return`
  (gọi tại `bin/fgos.mjs:1428`) — chạy `git status --porcelain -- .`, chỉ
  soi subtree của `cwd`.
- `src/runner/merge.mjs:133` định nghĩa `isWorkingTreeClean(repoRoot)`
  riêng cho `approve` (import alias `isMainTreeClean` tại
  `bin/fgos.mjs:33`, gọi tại `bin/fgos.mjs:1714`) — chạy
  `git status --porcelain` không pathspec, soi TOÀN repo.
```

### Full target unit

```text
- `bin/fgos.mjs:98` định nghĩa `isWorkingTreeClean(cwd)` riêng cho `return`
  (gọi tại `bin/fgos.mjs:1428`) — chạy `git status --porcelain -- .`, chỉ
  soi subtree của `cwd`.
- `src/runner/merge.mjs:133` định nghĩa `isWorkingTreeClean(repoRoot)`
  riêng cho `approve` (import alias `isMainTreeClean` tại
  `bin/fgos.mjs:33`, gọi tại `bin/fgos.mjs:1714`) — chạy
  `git status --porcelain` không pathspec, soi TOÀN repo.
```

### Full diff

```diff
No text difference.
```

## claim_e20450852b8cc81b71efd44e9774d4dc

Source digest: 005329794ba93eae5326a34a4d981ba9646d587f31a4157698b67e04f7d9177a

Target digest: 005329794ba93eae5326a34a4d981ba9646d587f31a4157698b67e04f7d9177a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-185",
  "sourceLines": [
    1958,
    1960
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-44",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "nativeTargetClaimId": "claim_7c9634ba6821e5db92767d653da02b30",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e20450852b8cc81b71efd44e9774d4dc",
    "sourceUnitDigest": "005329794ba93eae5326a34a4d981ba9646d587f31a4157698b67e04f7d9177a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-185 (lines 1958–1960) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-44. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "005329794ba93eae5326a34a4d981ba9646d587f31a4157698b67e04f7d9177a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
    ]
  }
}
```

### Full source unit

```text
Cả hai dùng chung 1 helper loại trừ (`isFgosOnlyStatusLine`) nhưng hàm gác
chính thì viết riêng 2 lần, với khác biệt phạm vi thật (subtree vs
whole-repo) — không phải trùng tên ngẫu nhiên, là 2 implementation thật.
```

### Full target unit

```text
Cả hai dùng chung 1 helper loại trừ (`isFgosOnlyStatusLine`) nhưng hàm gác
chính thì viết riêng 2 lần, với khác biệt phạm vi thật (subtree vs
whole-repo) — không phải trùng tên ngẫu nhiên, là 2 implementation thật.
```

### Full diff

```diff
No text difference.
```

## claim_9cf9f5275922a28d295ca75d7080371c

Source digest: 561f9b5b8579aa34f4f5d56b4fbbb90d7ab2b3f2846aeb8c0be5a1721c2c063f

Target digest: 561f9b5b8579aa34f4f5d56b4fbbb90d7ab2b3f2846aeb8c0be5a1721c2c063f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-186",
  "sourceLines": [
    1962,
    1967
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-45",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
  ],
  "nativeTargetClaimId": "claim_ff772fadca5a790bb863625d3e87a8dc",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "2-kiểm-tra-working-tree-sạch-2-định-nghĩa-độc-lập-cho-return-và-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9cf9f5275922a28d295ca75d7080371c",
    "sourceUnitDigest": "561f9b5b8579aa34f4f5d56b4fbbb90d7ab2b3f2846aeb8c0be5a1721c2c063f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-186 (lines 1962–1967) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-45. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "561f9b5b8579aa34f4f5d56b4fbbb90d7ab2b3f2846aeb8c0be5a1721c2c063f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`"
    ]
  }
}
```

### Full source unit

```text
**Đã sửa** (item `choke-point-workingtree-clean-duplication`, commit
`3dad0c2`): hợp nhất về 1 hàm `isWorkingTreeClean(repoRoot, ownFileSet,
{ scope })` trong `src/runner/merge.mjs`, `scope` nhận `'subtree'` (return)
hoặc `'whole-repo'` (approve, mặc định) — cùng 1 lần tính `prefix`, cùng 1
lần loại trừ `.fgos/`. `bin/fgos.mjs`'s own `isWorkingTreeClean(cwd,
ownFileSet)` giờ chỉ delegate sang hàm trên với `scope: 'subtree'`.
```

### Full target unit

```text
**Đã sửa** (item `choke-point-workingtree-clean-duplication`, commit
`3dad0c2`): hợp nhất về 1 hàm `isWorkingTreeClean(repoRoot, ownFileSet,
{ scope })` trong `src/runner/merge.mjs`, `scope` nhận `'subtree'` (return)
hoặc `'whole-repo'` (approve, mặc định) — cùng 1 lần tính `prefix`, cùng 1
lần loại trừ `.fgos/`. `bin/fgos.mjs`'s own `isWorkingTreeClean(cwd,
ownFileSet)` giờ chỉ delegate sang hàm trên với `scope: 'subtree'`.
```

### Full diff

```diff
No text difference.
```

## claim_9121a224604fce68e66e2bf9877a4231

Source digest: a78fe17050bf93323f164ddab36560dea3178d289cf4fe2faa2add23a0b28e02

Target digest: a78fe17050bf93323f164ddab36560dea3178d289cf4fe2faa2add23a0b28e02

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
  "sourceLines": [
    1969,
    1969
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
  ],
  "nativeTargetClaimId": "claim_a1a85edff2ec7570a8cd933073e38beb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9121a224604fce68e66e2bf9877a4231",
    "sourceUnitDigest": "a78fe17050bf93323f164ddab36560dea3178d289cf4fe2faa2add23a0b28e02",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng (lines 1969–1969) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a78fe17050bf93323f164ddab36560dea3178d289cf4fe2faa2add23a0b28e02",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
    ]
  }
}
```

### Full source unit

```text
###### 3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng

Re-verify tsk-53f's finding từ đầu theo —
xác nhận vẫn đúng 6 call site, line number đã trôi so với report cũ
(`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`,
tự nó là bằng chứng cho luận điểm của item này: tài liệu tĩnh trôi khỏi
code rất nhanh trong repo này):

| Ngữ cảnh | File:Line hôm nay | baseRef | Cleanup khi lỗi |
|---|---|---|---|
| `pick` | `bin/fgos.mjs` qua `claim-port.mjs:170` | HEAD hiện tại hoặc root branch (đã sửa theo baseRef truyền vào) | không có `finally`/cleanup tại call site này |
| `approve` (leaf merge, ephemeral) | `bin/fgos.mjs:1735` | root branch | có |
| `review` (ephemeral) | `bin/fgos.mjs:1994` | item branch | có |
| Runner `startupReap` | `src/runner/loop.mjs:398` | mặc định (không truyền `baseRef`) | có (`finally`) |
| Runner dispatch — LEAF | `src/runner/loop.mjs:679` | `branchNameFor(rootId)` | có |
| Runner dispatch — ROOT | `src/runner/loop.mjs:681` | mặc định | có |

`createWorktree` bản thân đã là 1 hàm dùng chung (`src/runner/worktree.mjs`)
— phần LẶP không nằm ở việc tạo worktree, mà ở việc MỖI call site tự quyết
`baseRef` nào truyền vào và tự viết cleanup riêng thay vì có 1 wrapper
chung theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch).
```

### Full target unit

```text
###### 3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng

Re-verify tsk-53f's finding từ đầu theo —
xác nhận vẫn đúng 6 call site, line number đã trôi so với report cũ
(`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`,
tự nó là bằng chứng cho luận điểm của item này: tài liệu tĩnh trôi khỏi
code rất nhanh trong repo này):

| Ngữ cảnh | File:Line hôm nay | baseRef | Cleanup khi lỗi |
|---|---|---|---|
| `pick` | `bin/fgos.mjs` qua `claim-port.mjs:170` | HEAD hiện tại hoặc root branch (đã sửa theo baseRef truyền vào) | không có `finally`/cleanup tại call site này |
| `approve` (leaf merge, ephemeral) | `bin/fgos.mjs:1735` | root branch | có |
| `review` (ephemeral) | `bin/fgos.mjs:1994` | item branch | có |
| Runner `startupReap` | `src/runner/loop.mjs:398` | mặc định (không truyền `baseRef`) | có (`finally`) |
| Runner dispatch — LEAF | `src/runner/loop.mjs:679` | `branchNameFor(rootId)` | có |
| Runner dispatch — ROOT | `src/runner/loop.mjs:681` | mặc định | có |

`createWorktree` bản thân đã là 1 hàm dùng chung (`src/runner/worktree.mjs`)
— phần LẶP không nằm ở việc tạo worktree, mà ở việc MỖI call site tự quyết
`baseRef` nào truyền vào và tự viết cleanup riêng thay vì có 1 wrapper
chung theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch).
```

### Full diff

```diff
No text difference.
```

## claim_533802b60054f03ee6b48aea33340ecf

Source digest: dbbf3a77b91376070365a3fe1576d9e90374b388b350bdcff1048fb2578ddd4f

Target digest: dbbf3a77b91376070365a3fe1576d9e90374b388b350bdcff1048fb2578ddd4f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-187",
  "sourceLines": [
    1971,
    1975
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-46",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
  ],
  "nativeTargetClaimId": "claim_3c2649742438e8a2c20aa6c5623eca6a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_533802b60054f03ee6b48aea33340ecf",
    "sourceUnitDigest": "dbbf3a77b91376070365a3fe1576d9e90374b388b350bdcff1048fb2578ddd4f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-187 (lines 1971–1975) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-46. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "dbbf3a77b91376070365a3fe1576d9e90374b388b350bdcff1048fb2578ddd4f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
    ]
  }
}
```

### Full source unit

```text
Re-verify tsk-53f's finding từ đầu theo —
xác nhận vẫn đúng 6 call site, line number đã trôi so với report cũ
(`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`,
tự nó là bằng chứng cho luận điểm của item này: tài liệu tĩnh trôi khỏi
code rất nhanh trong repo này):
```

### Full target unit

```text
Re-verify tsk-53f's finding từ đầu theo —
xác nhận vẫn đúng 6 call site, line number đã trôi so với report cũ
(`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`,
tự nó là bằng chứng cho luận điểm của item này: tài liệu tĩnh trôi khỏi
code rất nhanh trong repo này):
```

### Full diff

```diff
No text difference.
```

## claim_5f90a4f4debb0109bb2b0dadef12b6dc

Source digest: 8f98a68021c272707f029a56e974f4f947ff5b4a1ec95d41eed8fb82f836f8f2

Target digest: 8f98a68021c272707f029a56e974f4f947ff5b4a1ec95d41eed8fb82f836f8f2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-188",
  "sourceLines": [
    1977,
    1984
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-47",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
  ],
  "nativeTargetClaimId": "claim_3ddeb9040b093c2c25181098ffc37f88",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5f90a4f4debb0109bb2b0dadef12b6dc",
    "sourceUnitDigest": "8f98a68021c272707f029a56e974f4f947ff5b4a1ec95d41eed8fb82f836f8f2",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-188 (lines 1977–1984) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-47. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8f98a68021c272707f029a56e974f4f947ff5b4a1ec95d41eed8fb82f836f8f2",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
    ]
  }
}
```

### Full source unit

```text
| Ngữ cảnh | File:Line hôm nay | baseRef | Cleanup khi lỗi |
|---|---|---|---|
| `pick` | `bin/fgos.mjs` qua `claim-port.mjs:170` | HEAD hiện tại hoặc root branch (đã sửa theo baseRef truyền vào) | không có `finally`/cleanup tại call site này |
| `approve` (leaf merge, ephemeral) | `bin/fgos.mjs:1735` | root branch | có |
| `review` (ephemeral) | `bin/fgos.mjs:1994` | item branch | có |
| Runner `startupReap` | `src/runner/loop.mjs:398` | mặc định (không truyền `baseRef`) | có (`finally`) |
| Runner dispatch — LEAF | `src/runner/loop.mjs:679` | `branchNameFor(rootId)` | có |
| Runner dispatch — ROOT | `src/runner/loop.mjs:681` | mặc định | có |
```

### Full target unit

```text
| Ngữ cảnh | File:Line hôm nay | baseRef | Cleanup khi lỗi |
|---|---|---|---|
| `pick` | `bin/fgos.mjs` qua `claim-port.mjs:170` | HEAD hiện tại hoặc root branch (đã sửa theo baseRef truyền vào) | không có `finally`/cleanup tại call site này |
| `approve` (leaf merge, ephemeral) | `bin/fgos.mjs:1735` | root branch | có |
| `review` (ephemeral) | `bin/fgos.mjs:1994` | item branch | có |
| Runner `startupReap` | `src/runner/loop.mjs:398` | mặc định (không truyền `baseRef`) | có (`finally`) |
| Runner dispatch — LEAF | `src/runner/loop.mjs:679` | `branchNameFor(rootId)` | có |
| Runner dispatch — ROOT | `src/runner/loop.mjs:681` | mặc định | có |
```

### Full diff

```diff
No text difference.
```

## claim_6c453d9e400adf8c1bdadb6e6fb688f3

Source digest: 759c65f981960a67f83ed5554e9dc9177545ee22d90176ec90a7be18e188db4f

Target digest: 759c65f981960a67f83ed5554e9dc9177545ee22d90176ec90a7be18e188db4f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-189",
  "sourceLines": [
    1986,
    1989
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-48",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
  ],
  "nativeTargetClaimId": "claim_50b34b575b99e32abd3837f0862e4d11",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "3-createworktree-6-call-site-mỗi-nơi-tự-xử-lý-baserefcleanup-riêng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6c453d9e400adf8c1bdadb6e6fb688f3",
    "sourceUnitDigest": "759c65f981960a67f83ed5554e9dc9177545ee22d90176ec90a7be18e188db4f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-189 (lines 1986–1989) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-48. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "759c65f981960a67f83ed5554e9dc9177545ee22d90176ec90a7be18e188db4f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng"
    ]
  }
}
```

### Full source unit

```text
`createWorktree` bản thân đã là 1 hàm dùng chung (`src/runner/worktree.mjs`)
— phần LẶP không nằm ở việc tạo worktree, mà ở việc MỖI call site tự quyết
`baseRef` nào truyền vào và tự viết cleanup riêng thay vì có 1 wrapper
chung theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch).
```

### Full target unit

```text
`createWorktree` bản thân đã là 1 hàm dùng chung (`src/runner/worktree.mjs`)
— phần LẶP không nằm ở việc tạo worktree, mà ở việc MỖI call site tự quyết
`baseRef` nào truyền vào và tự viết cleanup riêng thay vì có 1 wrapper
chung theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch).
```

### Full diff

```diff
No text difference.
```

## claim_cbdb1b45324e09cc15d67abf3193f88a

Source digest: 8f791314d85f5a44668dd36435cbe2aa001b2df9d246fd1b992f5285306215c5

Target digest: 8f791314d85f5a44668dd36435cbe2aa001b2df9d246fd1b992f5285306215c5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng",
  "sourceLines": [
    1991,
    1991
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates"
  ],
  "nativeTargetClaimId": "claim_1cc9c4f74953c0793de3b792fcdc6dea",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_cbdb1b45324e09cc15d67abf3193f88a",
    "sourceUnitDigest": "8f791314d85f5a44668dd36435cbe2aa001b2df9d246fd1b992f5285306215c5",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng (lines 1991–1991) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8f791314d85f5a44668dd36435cbe2aa001b2df9d246fd1b992f5285306215c5",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates"
    ]
  }
}
```

### Full source unit

```text
##### Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)

Yêu cầu (2) của item đòi xác nhận thật, không chỉ giống bề ngoài — 3
candidate sau nằm trong 4 gợi ý gốc của description nhưng khi đọc code thì
ĐÃ hợp nhất đúng, không lặp:

- **Verify run + timeout**: 1 hàm dùng chung duy nhất,
  `runGoalCheck` (`src/runner/goal-check.mjs:20`) — gọi từ cả 8 nơi cần
  chạy verify (`bin/fgos.mjs:1391,1440,1886,2036`, `src/runner/loop.mjs:399,727`,
  `src/runner/merge.mjs:335`). Không có implementation thứ 2.
- **`docType` validation**: 1 hàm dùng chung duy nhất,
  `assertValidDocType` (`src/state/store.mjs:619`), gọi từ `bin/fgos.mjs:842`
  và nội bộ `store.mjs` (`addOutcome`, 2 chỗ). Comment tại
  `bin/fgos.mjs:808` tự xác nhận: "the single `DIATAXIS_DOC_TYPES` set".
- **`docsRef` validation**: 1 helper dùng chung, `optionalField`
  (`bin/fgos.mjs:172`), gọi 3 lần (`add`/`submit`/`edit`) với message lỗi
  khác nhau theo verb — khác message, không khác LOGIC kiểm tra, nên
  không tính là lặp thật.
- **Ghi `.fgos/events.jsonl`/`state.json` ở tầng thấp**: đã có 1 cửa ghi
  duy nhất có khóa, `withEventsLock`/`appendEventLocked`
  (`src/state/events.mjs`, dùng bởi mọi hàm ghi trong `store.mjs`) — tầng
  append-event tự nó KHÔNG hở, đúng như comment `store.mjs:24` tự nhận
  ("single-write-door scope stays exactly events.jsonl + state.json").
```

### Full target unit

```text
##### Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)

Yêu cầu (2) của item đòi xác nhận thật, không chỉ giống bề ngoài — 3
candidate sau nằm trong 4 gợi ý gốc của description nhưng khi đọc code thì
ĐÃ hợp nhất đúng, không lặp:

- **Verify run + timeout**: 1 hàm dùng chung duy nhất,
  `runGoalCheck` (`src/runner/goal-check.mjs:20`) — gọi từ cả 8 nơi cần
  chạy verify (`bin/fgos.mjs:1391,1440,1886,2036`, `src/runner/loop.mjs:399,727`,
  `src/runner/merge.mjs:335`). Không có implementation thứ 2.
- **`docType` validation**: 1 hàm dùng chung duy nhất,
  `assertValidDocType` (`src/state/store.mjs:619`), gọi từ `bin/fgos.mjs:842`
  và nội bộ `store.mjs` (`addOutcome`, 2 chỗ). Comment tại
  `bin/fgos.mjs:808` tự xác nhận: "the single `DIATAXIS_DOC_TYPES` set".
- **`docsRef` validation**: 1 helper dùng chung, `optionalField`
  (`bin/fgos.mjs:172`), gọi 3 lần (`add`/`submit`/`edit`) với message lỗi
  khác nhau theo verb — khác message, không khác LOGIC kiểm tra, nên
  không tính là lặp thật.
- **Ghi `.fgos/events.jsonl`/`state.json` ở tầng thấp**: đã có 1 cửa ghi
  duy nhất có khóa, `withEventsLock`/`appendEventLocked`
  (`src/state/events.mjs`, dùng bởi mọi hàm ghi trong `store.mjs`) — tầng
  append-event tự nó KHÔNG hở, đúng như comment `store.mjs:24` tự nhận
  ("single-write-door scope stays exactly events.jsonl + state.json").
```

### Full diff

```diff
No text difference.
```

## claim_eac67903478bf345629ba008d8a46d91

Source digest: 859322d7e03ba251cc3177a83bed1cac0188f8e5bc23825d26796c31681d14c3

Target digest: 859322d7e03ba251cc3177a83bed1cac0188f8e5bc23825d26796c31681d14c3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-190",
  "sourceLines": [
    1993,
    1995
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-49",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)"
  ],
  "nativeTargetClaimId": "claim_66051eaccfc54933795d4758408f34af",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_eac67903478bf345629ba008d8a46d91",
    "sourceUnitDigest": "859322d7e03ba251cc3177a83bed1cac0188f8e5bc23825d26796c31681d14c3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-190 (lines 1993–1995) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-49. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "859322d7e03ba251cc3177a83bed1cac0188f8e5bc23825d26796c31681d14c3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)"
    ]
  }
}
```

### Full source unit

```text
Yêu cầu (2) của item đòi xác nhận thật, không chỉ giống bề ngoài — 3
candidate sau nằm trong 4 gợi ý gốc của description nhưng khi đọc code thì
ĐÃ hợp nhất đúng, không lặp:
```

### Full target unit

```text
Yêu cầu (2) của item đòi xác nhận thật, không chỉ giống bề ngoài — 3
candidate sau nằm trong 4 gợi ý gốc của description nhưng khi đọc code thì
ĐÃ hợp nhất đúng, không lặp:
```

### Full diff

```diff
No text difference.
```

## claim_3eb8339e6534b30ba7e1214255a11800

Source digest: 04174a53f9d8f1ae7bc640d0a271d2089572641d139fc53f456c63e003454b5d

Target digest: 04174a53f9d8f1ae7bc640d0a271d2089572641d139fc53f456c63e003454b5d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-191",
  "sourceLines": [
    1997,
    2013
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-50",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)"
  ],
  "nativeTargetClaimId": "claim_f8bd1f9f17378d49363acc435d68c38e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đã-kiểm-tra-không-phải-choke-point-loại-khỏi-danh-sách-có-bằng-chứng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3eb8339e6534b30ba7e1214255a11800",
    "sourceUnitDigest": "04174a53f9d8f1ae7bc640d0a271d2089572641d139fc53f456c63e003454b5d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-50",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-191 (lines 1997–2013) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-50. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "04174a53f9d8f1ae7bc640d0a271d2089572641d139fc53f456c63e003454b5d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)"
    ]
  }
}
```

### Full source unit

```text
- **Verify run + timeout**: 1 hàm dùng chung duy nhất,
  `runGoalCheck` (`src/runner/goal-check.mjs:20`) — gọi từ cả 8 nơi cần
  chạy verify (`bin/fgos.mjs:1391,1440,1886,2036`, `src/runner/loop.mjs:399,727`,
  `src/runner/merge.mjs:335`). Không có implementation thứ 2.
- **`docType` validation**: 1 hàm dùng chung duy nhất,
  `assertValidDocType` (`src/state/store.mjs:619`), gọi từ `bin/fgos.mjs:842`
  và nội bộ `store.mjs` (`addOutcome`, 2 chỗ). Comment tại
  `bin/fgos.mjs:808` tự xác nhận: "the single `DIATAXIS_DOC_TYPES` set".
- **`docsRef` validation**: 1 helper dùng chung, `optionalField`
  (`bin/fgos.mjs:172`), gọi 3 lần (`add`/`submit`/`edit`) với message lỗi
  khác nhau theo verb — khác message, không khác LOGIC kiểm tra, nên
  không tính là lặp thật.
- **Ghi `.fgos/events.jsonl`/`state.json` ở tầng thấp**: đã có 1 cửa ghi
  duy nhất có khóa, `withEventsLock`/`appendEventLocked`
  (`src/state/events.mjs`, dùng bởi mọi hàm ghi trong `store.mjs`) — tầng
  append-event tự nó KHÔNG hở, đúng như comment `store.mjs:24` tự nhận
  ("single-write-door scope stays exactly events.jsonl + state.json").
```

### Full target unit

```text
- **Verify run + timeout**: 1 hàm dùng chung duy nhất,
  `runGoalCheck` (`src/runner/goal-check.mjs:20`) — gọi từ cả 8 nơi cần
  chạy verify (`bin/fgos.mjs:1391,1440,1886,2036`, `src/runner/loop.mjs:399,727`,
  `src/runner/merge.mjs:335`). Không có implementation thứ 2.
- **`docType` validation**: 1 hàm dùng chung duy nhất,
  `assertValidDocType` (`src/state/store.mjs:619`), gọi từ `bin/fgos.mjs:842`
  và nội bộ `store.mjs` (`addOutcome`, 2 chỗ). Comment tại
  `bin/fgos.mjs:808` tự xác nhận: "the single `DIATAXIS_DOC_TYPES` set".
- **`docsRef` validation**: 1 helper dùng chung, `optionalField`
  (`bin/fgos.mjs:172`), gọi 3 lần (`add`/`submit`/`edit`) với message lỗi
  khác nhau theo verb — khác message, không khác LOGIC kiểm tra, nên
  không tính là lặp thật.
- **Ghi `.fgos/events.jsonl`/`state.json` ở tầng thấp**: đã có 1 cửa ghi
  duy nhất có khóa, `withEventsLock`/`appendEventLocked`
  (`src/state/events.mjs`, dùng bởi mọi hàm ghi trong `store.mjs`) — tầng
  append-event tự nó KHÔNG hở, đúng như comment `store.mjs:24` tự nhận
  ("single-write-door scope stays exactly events.jsonl + state.json").
```

### Full diff

```diff
No text difference.
```

## claim_6c5782d3c915607c1c05c83fb5ebd255

Source digest: d22438074db150b18a097bf95f2422820648903c6bb211b4fb534786fb80abe8

Target digest: d22438074db150b18a097bf95f2422820648903c6bb211b4fb534786fb80abe8

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "ghi-chú-liên-quan-không-phải-finding-mới-của-item-này",
  "sourceLines": [
    2015,
    2015
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "ghi-chú-liên-quan-không-phải-finding-mới-của-item-này",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates"
  ],
  "nativeTargetClaimId": "claim_ec812033b89808a9708e56ffb1f565c6",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "ghi-chú-liên-quan-không-phải-finding-mới-của-item-này",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6c5782d3c915607c1c05c83fb5ebd255",
    "sourceUnitDigest": "d22438074db150b18a097bf95f2422820648903c6bb211b4fb534786fb80abe8",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "ghi-chú-liên-quan-không-phải-finding-mới-của-item-này",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#ghi-chú-liên-quan-không-phải-finding-mới-của-item-này (lines 2015–2015) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#ghi-chú-liên-quan-không-phải-finding-mới-của-item-này. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d22438074db150b18a097bf95f2422820648903c6bb211b4fb534786fb80abe8",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates"
    ]
  }
}
```

### Full source unit

```text
##### Ghi chú liên quan — không phải finding mới của item này

`main-checkout-lock.mjs` (2 export `acquireMainCheckoutLock`/
`releaseMainCheckoutLock`) từng bị tsk-53f's report gọi là "dead code,
imported by NOTHING" — claim đó nay ĐÃ SAI: `src/runner/claim-port.mjs:12,73`
import và gọi thật (wired post tsk-53f). Đào sâu hơn lộ ra đây là 1
cơ chế RIÊNG với mục đích khác — khóa claim-identity tại thời điểm claim,
không phải khóa git-commit — và cơ chế bảo vệ git-commit race (vụ `tsk-3w8`,
`approve`'s `git commit --no-edit` xung đột) đã được quyết định RIÊNG,
KHÔNG qua app-level lock mà qua `.githooks/pre-commit` (mọi actor, mọi
commit) — xem `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`,
đã accepted, có nêu rõ khoảng hở còn mở (hook không active mặc định) và
đã tự đóng thành 1 câu hỏi để dành cho item riêng nếu có bằng chứng thật.
Không liệt lại thành candidate riêng của tsk-1ab vì đã có quyết định +
theo dõi sẵn — trích dẫn ở đây để không đọc nhầm 2 cơ chế cùng tên
"main-checkout-lock" là một.
```

### Full target unit

```text
##### Ghi chú liên quan — không phải finding mới của item này

`main-checkout-lock.mjs` (2 export `acquireMainCheckoutLock`/
`releaseMainCheckoutLock`) từng bị tsk-53f's report gọi là "dead code,
imported by NOTHING" — claim đó nay ĐÃ SAI: `src/runner/claim-port.mjs:12,73`
import và gọi thật (wired post tsk-53f). Đào sâu hơn lộ ra đây là 1
cơ chế RIÊNG với mục đích khác — khóa claim-identity tại thời điểm claim,
không phải khóa git-commit — và cơ chế bảo vệ git-commit race (vụ `tsk-3w8`,
`approve`'s `git commit --no-edit` xung đột) đã được quyết định RIÊNG,
KHÔNG qua app-level lock mà qua `.githooks/pre-commit` (mọi actor, mọi
commit) — xem `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`,
đã accepted, có nêu rõ khoảng hở còn mở (hook không active mặc định) và
đã tự đóng thành 1 câu hỏi để dành cho item riêng nếu có bằng chứng thật.
Không liệt lại thành candidate riêng của tsk-1ab vì đã có quyết định +
theo dõi sẵn — trích dẫn ở đây để không đọc nhầm 2 cơ chế cùng tên
"main-checkout-lock" là một.
```

### Full diff

```diff
No text difference.
```

## claim_76fb7a95c77c1134d95835418caae508

Source digest: ad714a17bc5ae5567005c74f4b8a49358e2e38030ea9a55cd77d030c552ab834

Target digest: ad714a17bc5ae5567005c74f4b8a49358e2e38030ea9a55cd77d030c552ab834

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-192",
  "sourceLines": [
    2017,
    2030
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Ghi chú liên quan — không phải finding mới của item này"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-51",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Ghi chú liên quan — không phải finding mới của item này"
  ],
  "nativeTargetClaimId": "claim_cc4fd841f0c358167ab45bfbc861eb30",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "ghi-chú-liên-quan-không-phải-finding-mới-của-item-này",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_76fb7a95c77c1134d95835418caae508",
    "sourceUnitDigest": "ad714a17bc5ae5567005c74f4b8a49358e2e38030ea9a55cd77d030c552ab834",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-51",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-192 (lines 2017–2030) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-51. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ad714a17bc5ae5567005c74f4b8a49358e2e38030ea9a55cd77d030c552ab834",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Ghi chú liên quan — không phải finding mới của item này"
    ]
  }
}
```

### Full source unit

```text
`main-checkout-lock.mjs` (2 export `acquireMainCheckoutLock`/
`releaseMainCheckoutLock`) từng bị tsk-53f's report gọi là "dead code,
imported by NOTHING" — claim đó nay ĐÃ SAI: `src/runner/claim-port.mjs:12,73`
import và gọi thật (wired post tsk-53f). Đào sâu hơn lộ ra đây là 1
cơ chế RIÊNG với mục đích khác — khóa claim-identity tại thời điểm claim,
không phải khóa git-commit — và cơ chế bảo vệ git-commit race (vụ `tsk-3w8`,
`approve`'s `git commit --no-edit` xung đột) đã được quyết định RIÊNG,
KHÔNG qua app-level lock mà qua `.githooks/pre-commit` (mọi actor, mọi
commit) — xem `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`,
đã accepted, có nêu rõ khoảng hở còn mở (hook không active mặc định) và
đã tự đóng thành 1 câu hỏi để dành cho item riêng nếu có bằng chứng thật.
Không liệt lại thành candidate riêng của tsk-1ab vì đã có quyết định +
theo dõi sẵn — trích dẫn ở đây để không đọc nhầm 2 cơ chế cùng tên
"main-checkout-lock" là một.
```

### Full target unit

```text
`main-checkout-lock.mjs` (2 export `acquireMainCheckoutLock`/
`releaseMainCheckoutLock`) từng bị tsk-53f's report gọi là "dead code,
imported by NOTHING" — claim đó nay ĐÃ SAI: `src/runner/claim-port.mjs:12,73`
import và gọi thật (wired post tsk-53f). Đào sâu hơn lộ ra đây là 1
cơ chế RIÊNG với mục đích khác — khóa claim-identity tại thời điểm claim,
không phải khóa git-commit — và cơ chế bảo vệ git-commit race (vụ `tsk-3w8`,
`approve`'s `git commit --no-edit` xung đột) đã được quyết định RIÊNG,
KHÔNG qua app-level lock mà qua `.githooks/pre-commit` (mọi actor, mọi
commit) — xem `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`,
đã accepted, có nêu rõ khoảng hở còn mở (hook không active mặc định) và
đã tự đóng thành 1 câu hỏi để dành cho item riêng nếu có bằng chứng thật.
Không liệt lại thành candidate riêng của tsk-1ab vì đã có quyết định +
theo dõi sẵn — trích dẫn ở đây để không đọc nhầm 2 cơ chế cùng tên
"main-checkout-lock" là một.
```

### Full diff

```diff
No text difference.
```

## claim_ab17d2e0d5e4c02ee484af949c0ed6d9

Source digest: ee1cb2a967d0c218f823083a8bc9a3ea16f1f8143ad93917deed9b8182b89d83

Target digest: ee1cb2a967d0c218f823083a8bc9a3ea16f1f8143ad93917deed9b8182b89d83

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "ranked-priority",
  "sourceLines": [
    2032,
    2032
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "ranked-priority",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "nativeTargetClaimId": "claim_1d136f54b6e65a9a2f649e3b7fca71dd",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "ranked-priority",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ab17d2e0d5e4c02ee484af949c0ed6d9",
    "sourceUnitDigest": "ee1cb2a967d0c218f823083a8bc9a3ea16f1f8143ad93917deed9b8182b89d83",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "ranked-priority",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#ranked-priority (lines 2032–2032) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#ranked-priority. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ee1cb2a967d0c218f823083a8bc9a3ea16f1f8143ad93917deed9b8182b89d83",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
    ]
  }
}
```

### Full source unit

```text
#### Ranked priority

1 bảng phẳng duy nhất — sort theo rủi ro lệch hành vi trước, tần suất
gọi làm tie-break. Chỉ xếp hạng 3 candidate đã XÁC NHẬN THẬT ở trên (mục
"Đã kiểm tra, KHÔNG phải choke-point" không vào bảng này vì không phải
việc cần hợp nhất).

| Hạng | Choke-point | Rủi ro lệch hành vi | Tần suất | Vì sao |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility (#1) | **Cao** — không chỉ khác hành vi ngầm, mà khiến lệnh do chính `fgos-routing` hướng dẫn literal bị CLI reject cứng, giữa chừng 1 session | Rất cao — `fgos-routing` được nạp "at the start of every fgOS work session" (chính mô tả skill), nên bất kỳ session nào theo đúng ví dụ prose sẽ dính | Sửa 1 lần (đồng bộ guard giữa `take`/`pick`, hoặc sửa lại prose `fgos-routing` theo hành vi thật của `pick`) chặn đứng lỗi lặp lại ở mọi session tương lai |
| 2 | `isWorkingTreeClean` trùng lặp (`return` vs `approve`, #2) | Trung bình — 2 phạm vi khác nhau thật (subtree vs whole-repo) có thể khiến `return` coi là sạch trong khi `approve` sau đó lại thấy bẩn (hoặc ngược lại), lệch kỳ vọng giữa 2 verb lõi | Cao — mọi lần `return` và mọi lần `approve` đều chạy qua 1 trong 2 hàm này | Hợp nhất về 1 hàm nhận tham số phạm vi (subtree/whole-repo) thay vì 2 định nghĩa riêng, để đảm bảo cùng logic loại trừ + cùng cách tính prefix |
| 3 | `createWorktree` 6 call site tự quyết baseRef/cleanup (#3) | Trung bình-thấp — mỗi nơi đã tự đúng theo ngữ cảnh riêng (baseRef hợp lý theo leaf/root, hầu hết đã có cleanup), rủi ro chủ yếu là worktree mồ côi khi cleanup thiếu (site `pick`), không phải state sai | Cao — 6 call site trải khắp `pick`/`approve`/`review`/runner dispatch, chạy thường xuyên | Thêm 1 wrapper theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch) bọc `createWorktree` + cleanup thống nhất, thay vì sửa lẻ từng site |
```

### Full target unit

```text
#### Ranked priority

1 bảng phẳng duy nhất — sort theo rủi ro lệch hành vi trước, tần suất
gọi làm tie-break. Chỉ xếp hạng 3 candidate đã XÁC NHẬN THẬT ở trên (mục
"Đã kiểm tra, KHÔNG phải choke-point" không vào bảng này vì không phải
việc cần hợp nhất).

| Hạng | Choke-point | Rủi ro lệch hành vi | Tần suất | Vì sao |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility (#1) | **Cao** — không chỉ khác hành vi ngầm, mà khiến lệnh do chính `fgos-routing` hướng dẫn literal bị CLI reject cứng, giữa chừng 1 session | Rất cao — `fgos-routing` được nạp "at the start of every fgOS work session" (chính mô tả skill), nên bất kỳ session nào theo đúng ví dụ prose sẽ dính | Sửa 1 lần (đồng bộ guard giữa `take`/`pick`, hoặc sửa lại prose `fgos-routing` theo hành vi thật của `pick`) chặn đứng lỗi lặp lại ở mọi session tương lai |
| 2 | `isWorkingTreeClean` trùng lặp (`return` vs `approve`, #2) | Trung bình — 2 phạm vi khác nhau thật (subtree vs whole-repo) có thể khiến `return` coi là sạch trong khi `approve` sau đó lại thấy bẩn (hoặc ngược lại), lệch kỳ vọng giữa 2 verb lõi | Cao — mọi lần `return` và mọi lần `approve` đều chạy qua 1 trong 2 hàm này | Hợp nhất về 1 hàm nhận tham số phạm vi (subtree/whole-repo) thay vì 2 định nghĩa riêng, để đảm bảo cùng logic loại trừ + cùng cách tính prefix |
| 3 | `createWorktree` 6 call site tự quyết baseRef/cleanup (#3) | Trung bình-thấp — mỗi nơi đã tự đúng theo ngữ cảnh riêng (baseRef hợp lý theo leaf/root, hầu hết đã có cleanup), rủi ro chủ yếu là worktree mồ côi khi cleanup thiếu (site `pick`), không phải state sai | Cao — 6 call site trải khắp `pick`/`approve`/`review`/runner dispatch, chạy thường xuyên | Thêm 1 wrapper theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch) bọc `createWorktree` + cleanup thống nhất, thay vì sửa lẻ từng site |
```

### Full diff

```diff
No text difference.
```

## claim_e69c1ad0321ac1bab192b7b445e12c32

Source digest: 064c04105ece55b1cd8313e676ad073e7af42bca3d53e1f81c0134486111c293

Target digest: 064c04105ece55b1cd8313e676ad073e7af42bca3d53e1f81c0134486111c293

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-193",
  "sourceLines": [
    2034,
    2037
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Ranked priority"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-52",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Ranked priority"
  ],
  "nativeTargetClaimId": "claim_60144a28d8086cb368d2179301f94403",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "ranked-priority",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e69c1ad0321ac1bab192b7b445e12c32",
    "sourceUnitDigest": "064c04105ece55b1cd8313e676ad073e7af42bca3d53e1f81c0134486111c293",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-52",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-193 (lines 2034–2037) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-52. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "064c04105ece55b1cd8313e676ad073e7af42bca3d53e1f81c0134486111c293",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Ranked priority"
    ]
  }
}
```

### Full source unit

```text
1 bảng phẳng duy nhất — sort theo rủi ro lệch hành vi trước, tần suất
gọi làm tie-break. Chỉ xếp hạng 3 candidate đã XÁC NHẬN THẬT ở trên (mục
"Đã kiểm tra, KHÔNG phải choke-point" không vào bảng này vì không phải
việc cần hợp nhất).
```

### Full target unit

```text
1 bảng phẳng duy nhất — sort theo rủi ro lệch hành vi trước, tần suất
gọi làm tie-break. Chỉ xếp hạng 3 candidate đã XÁC NHẬN THẬT ở trên (mục
"Đã kiểm tra, KHÔNG phải choke-point" không vào bảng này vì không phải
việc cần hợp nhất).
```

### Full diff

```diff
No text difference.
```

## claim_ea8cffbdab27d692943b9b21f17cff59

Source digest: 1b59b5f415fe1593e443246dcf2185ed28f1ae18badb5046bf3aa3d0ce802582

Target digest: 1b59b5f415fe1593e443246dcf2185ed28f1ae18badb5046bf3aa3d0ce802582

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-194",
  "sourceLines": [
    2039,
    2043
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Ranked priority"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-53",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Ranked priority"
  ],
  "nativeTargetClaimId": "claim_ff27e5f6fed45ef16a98e8c7187680aa",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "ranked-priority",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ea8cffbdab27d692943b9b21f17cff59",
    "sourceUnitDigest": "1b59b5f415fe1593e443246dcf2185ed28f1ae18badb5046bf3aa3d0ce802582",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-53",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-194 (lines 2039–2043) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-53. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1b59b5f415fe1593e443246dcf2185ed28f1ae18badb5046bf3aa3d0ce802582",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Ranked priority"
    ]
  }
}
```

### Full source unit

```text
| Hạng | Choke-point | Rủi ro lệch hành vi | Tần suất | Vì sao |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility (#1) | **Cao** — không chỉ khác hành vi ngầm, mà khiến lệnh do chính `fgos-routing` hướng dẫn literal bị CLI reject cứng, giữa chừng 1 session | Rất cao — `fgos-routing` được nạp "at the start of every fgOS work session" (chính mô tả skill), nên bất kỳ session nào theo đúng ví dụ prose sẽ dính | Sửa 1 lần (đồng bộ guard giữa `take`/`pick`, hoặc sửa lại prose `fgos-routing` theo hành vi thật của `pick`) chặn đứng lỗi lặp lại ở mọi session tương lai |
| 2 | `isWorkingTreeClean` trùng lặp (`return` vs `approve`, #2) | Trung bình — 2 phạm vi khác nhau thật (subtree vs whole-repo) có thể khiến `return` coi là sạch trong khi `approve` sau đó lại thấy bẩn (hoặc ngược lại), lệch kỳ vọng giữa 2 verb lõi | Cao — mọi lần `return` và mọi lần `approve` đều chạy qua 1 trong 2 hàm này | Hợp nhất về 1 hàm nhận tham số phạm vi (subtree/whole-repo) thay vì 2 định nghĩa riêng, để đảm bảo cùng logic loại trừ + cùng cách tính prefix |
| 3 | `createWorktree` 6 call site tự quyết baseRef/cleanup (#3) | Trung bình-thấp — mỗi nơi đã tự đúng theo ngữ cảnh riêng (baseRef hợp lý theo leaf/root, hầu hết đã có cleanup), rủi ro chủ yếu là worktree mồ côi khi cleanup thiếu (site `pick`), không phải state sai | Cao — 6 call site trải khắp `pick`/`approve`/`review`/runner dispatch, chạy thường xuyên | Thêm 1 wrapper theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch) bọc `createWorktree` + cleanup thống nhất, thay vì sửa lẻ từng site |
```

### Full target unit

```text
| Hạng | Choke-point | Rủi ro lệch hành vi | Tần suất | Vì sao |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility (#1) | **Cao** — không chỉ khác hành vi ngầm, mà khiến lệnh do chính `fgos-routing` hướng dẫn literal bị CLI reject cứng, giữa chừng 1 session | Rất cao — `fgos-routing` được nạp "at the start of every fgOS work session" (chính mô tả skill), nên bất kỳ session nào theo đúng ví dụ prose sẽ dính | Sửa 1 lần (đồng bộ guard giữa `take`/`pick`, hoặc sửa lại prose `fgos-routing` theo hành vi thật của `pick`) chặn đứng lỗi lặp lại ở mọi session tương lai |
| 2 | `isWorkingTreeClean` trùng lặp (`return` vs `approve`, #2) | Trung bình — 2 phạm vi khác nhau thật (subtree vs whole-repo) có thể khiến `return` coi là sạch trong khi `approve` sau đó lại thấy bẩn (hoặc ngược lại), lệch kỳ vọng giữa 2 verb lõi | Cao — mọi lần `return` và mọi lần `approve` đều chạy qua 1 trong 2 hàm này | Hợp nhất về 1 hàm nhận tham số phạm vi (subtree/whole-repo) thay vì 2 định nghĩa riêng, để đảm bảo cùng logic loại trừ + cùng cách tính prefix |
| 3 | `createWorktree` 6 call site tự quyết baseRef/cleanup (#3) | Trung bình-thấp — mỗi nơi đã tự đúng theo ngữ cảnh riêng (baseRef hợp lý theo leaf/root, hầu hết đã có cleanup), rủi ro chủ yếu là worktree mồ côi khi cleanup thiếu (site `pick`), không phải state sai | Cao — 6 call site trải khắp `pick`/`approve`/`review`/runner dispatch, chạy thường xuyên | Thêm 1 wrapper theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch) bọc `createWorktree` + cleanup thống nhất, thay vì sửa lẻ từng site |
```

### Full diff

```diff
No text difference.
```

## claim_5d4011da92ecd1ef38890896ddec0b30

Source digest: 548b6bf935db008c18905bf1410559c4382dbc9ec1d6188f5d7c198dd76e0f16

Target digest: 548b6bf935db008c18905bf1410559c4382dbc9ec1d6188f5d7c198dd76e0f16

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "no-fixes-applied",
  "sourceLines": [
    2045,
    2045
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "no-fixes-applied",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "nativeTargetClaimId": "claim_9c032c706e7280b54055e3a75982c05b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "no-fixes-applied",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5d4011da92ecd1ef38890896ddec0b30",
    "sourceUnitDigest": "548b6bf935db008c18905bf1410559c4382dbc9ec1d6188f5d7c198dd76e0f16",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "no-fixes-applied",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#no-fixes-applied (lines 2045–2045) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#no-fixes-applied. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "548b6bf935db008c18905bf1410559c4382dbc9ec1d6188f5d7c198dd76e0f16",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
    ]
  }
}
```

### Full source unit

```text
#### No fixes applied

Đúng yêu cầu (4) của item: khảo sát này KHÔNG tự sửa bất kỳ choke-point
nào ở trên. Mỗi dòng trong bảng xếp hạng, nếu được chọn để sửa, trở thành
1 item riêng sau này (như cách finding của `tsk-53f` đã tách thành item
độc lập) — không nằm trong phạm vi thi công của `tsk-1ab`/`tsk-1ab-1`/
`tsk-1ab-2`.
```

### Full target unit

```text
#### No fixes applied

Đúng yêu cầu (4) của item: khảo sát này KHÔNG tự sửa bất kỳ choke-point
nào ở trên. Mỗi dòng trong bảng xếp hạng, nếu được chọn để sửa, trở thành
1 item riêng sau này (như cách finding của `tsk-53f` đã tách thành item
độc lập) — không nằm trong phạm vi thi công của `tsk-1ab`/`tsk-1ab-1`/
`tsk-1ab-2`.
```

### Full diff

```diff
No text difference.
```

## claim_5e0493e873f065e86c03c915d2b9f47a

Source digest: d6f6cfbfa892fc47c7bf22b891dccc8d67bc724c09f818d4c74d3f6e1a9b2f37

Target digest: d6f6cfbfa892fc47c7bf22b891dccc8d67bc724c09f818d4c74d3f6e1a9b2f37

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-195",
  "sourceLines": [
    2047,
    2051
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "No fixes applied"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-54",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "No fixes applied"
  ],
  "nativeTargetClaimId": "claim_c7232bb86777fc6743f8563b3a55a4c5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "no-fixes-applied",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5e0493e873f065e86c03c915d2b9f47a",
    "sourceUnitDigest": "d6f6cfbfa892fc47c7bf22b891dccc8d67bc724c09f818d4c74d3f6e1a9b2f37",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-54",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-195 (lines 2047–2051) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-54. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d6f6cfbfa892fc47c7bf22b891dccc8d67bc724c09f818d4c74d3f6e1a9b2f37",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "No fixes applied"
    ]
  }
}
```

### Full source unit

```text
Đúng yêu cầu (4) của item: khảo sát này KHÔNG tự sửa bất kỳ choke-point
nào ở trên. Mỗi dòng trong bảng xếp hạng, nếu được chọn để sửa, trở thành
1 item riêng sau này (như cách finding của `tsk-53f` đã tách thành item
độc lập) — không nằm trong phạm vi thi công của `tsk-1ab`/`tsk-1ab-1`/
`tsk-1ab-2`.
```

### Full target unit

```text
Đúng yêu cầu (4) của item: khảo sát này KHÔNG tự sửa bất kỳ choke-point
nào ở trên. Mỗi dòng trong bảng xếp hạng, nếu được chọn để sửa, trở thành
1 item riêng sau này (như cách finding của `tsk-53f` đã tách thành item
độc lập) — không nằm trong phạm vi thi công của `tsk-1ab`/`tsk-1ab-1`/
`tsk-1ab-2`.
```

### Full diff

```diff
No text difference.
```

## claim_8e7177164c1170f64004f6394da10f28

Source digest: 71c4c7fc47a234ace33d1fab94af73c79c2f18a1ef050fa9f5fd9c04c768f2ea

Target digest: 71c4c7fc47a234ace33d1fab94af73c79c2f18a1ef050fa9f5fd9c04c768f2ea

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0023-thứ-tự-ưu-tiên-sản-phẩm-ship-faster-dod-result-docs-hoàn-thiện-sau-ngưỡng",
  "sourceLines": [
    2053,
    2053
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0023-thứ-tự-ưu-tiên-sản-phẩm-ship-faster-dod-result-docs-hoàn-thiện-sau-ngưỡng",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_23ceae7f4fc8c1276da615d2d8c86aa0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0023-thứ-tự-ưu-tiên-sản-phẩm-ship-faster-dod-result-docs-hoàn-thiện-sau-ngưỡng",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8e7177164c1170f64004f6394da10f28",
    "sourceUnitDigest": "71c4c7fc47a234ace33d1fab94af73c79c2f18a1ef050fa9f5fd9c04c768f2ea",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0023-thứ-tự-ưu-tiên-sản-phẩm-ship-faster-dod-result-docs-hoàn-thiện-sau-ngưỡng",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0023-thứ-tự-ưu-tiên-sản-phẩm-ship-faster-dod-result-docs-hoàn-thiện-sau-ngưỡng (lines 2053–2053) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0023-thứ-tự-ưu-tiên-sản-phẩm-ship-faster-dod-result-docs-hoàn-thiện-sau-ngưỡng. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "71c4c7fc47a234ace33d1fab94af73c79c2f18a1ef050fa9f5fd9c04c768f2ea",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng
```

### Full target unit

```text
### 0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng
```

### Full diff

```diff
No text difference.
```

## claim_ace313a6fdc22d289460ebc961626058

Source digest: 075828bc1bd5b16a6aafd698e6df6b86fe652be3869fb73bad7375114adc3d59

Target digest: 075828bc1bd5b16a6aafd698e6df6b86fe652be3869fb73bad7375114adc3d59

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-5",
  "sourceLines": [
    2055,
    2055
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-5",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
  ],
  "nativeTargetClaimId": "claim_23612d5e4079fc7e4f45b34665322b52",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ace313a6fdc22d289460ebc961626058",
    "sourceUnitDigest": "075828bc1bd5b16a6aafd698e6df6b86fe652be3869fb73bad7375114adc3d59",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-5 (lines 2055–2055) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "075828bc1bd5b16a6aafd698e6df6b86fe652be3869fb73bad7375114adc3d59",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

User nêu định hướng ưu tiên cho dự án (session `b0010842-aafa-4cf1-9a8a-
6c7f0022d4c7`, 2026-07-28), bản gốc:

1. Ship faster — phải nhanh trước hết.
2. Better docs — thời AI, làm nhanh mà không có docs thì người khó tham gia
   vào tiến trình đảm bảo better result.
3. Better/stable result.

Phản biện: docs không nên đứng thành 1 bậc ưu tiên riêng tách khỏi result —
"on-eyes" (người đọc-hiểu để tham gia được) cần 2 trụ đồng thời, không phải
xếp tầng: **legibility** (docs) và **verifiability** (kiểm được đúng-sai
thật, không dựa lời khai — result đã verify cho được, docs không cho được).
Tách
riêng khiến "ship nhanh + docs tốt nhưng result chưa verify" đọc như đã đạt
bậc 2, dù chưa đủ tin. Gộp lại thành 1 mệnh đề CoS bắt buộc — **DoD** — đúng
kiểu STR73 đã đòi hỏi cho mọi mệnh đề CoS khác (evidence-link bắt buộc, không
chỉ cho feature-closed). Hạ tầng đối chiếu doc↔source đã có sẵn một phần:
`fgos doc-sources <docPath>` (`bin/fgos.mjs:1149`).
```

### Full target unit

```text
#### Bối cảnh

User nêu định hướng ưu tiên cho dự án (session `b0010842-aafa-4cf1-9a8a-
6c7f0022d4c7`, 2026-07-28), bản gốc:

1. Ship faster — phải nhanh trước hết.
2. Better docs — thời AI, làm nhanh mà không có docs thì người khó tham gia
   vào tiến trình đảm bảo better result.
3. Better/stable result.

Phản biện: docs không nên đứng thành 1 bậc ưu tiên riêng tách khỏi result —
"on-eyes" (người đọc-hiểu để tham gia được) cần 2 trụ đồng thời, không phải
xếp tầng: **legibility** (docs) và **verifiability** (kiểm được đúng-sai
thật, không dựa lời khai — result đã verify cho được, docs không cho được).
Tách
riêng khiến "ship nhanh + docs tốt nhưng result chưa verify" đọc như đã đạt
bậc 2, dù chưa đủ tin. Gộp lại thành 1 mệnh đề CoS bắt buộc — **DoD** — đúng
kiểu STR73 đã đòi hỏi cho mọi mệnh đề CoS khác (evidence-link bắt buộc, không
chỉ cho feature-closed). Hạ tầng đối chiếu doc↔source đã có sẵn một phần:
`fgos doc-sources <docPath>` (`bin/fgos.mjs:1149`).
```

### Full diff

```diff
No text difference.
```

## claim_e1b08b2f6139de01967d11160e3596c7

Source digest: aa6de8eb080e0ac318b5ab4cabb9cda92167820f63574fd60e9c94ad25868b82

Target digest: aa6de8eb080e0ac318b5ab4cabb9cda92167820f63574fd60e9c94ad25868b82

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-196",
  "sourceLines": [
    2057,
    2058
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-55",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_8745b2b2ce672621c986b5355fa49d85",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e1b08b2f6139de01967d11160e3596c7",
    "sourceUnitDigest": "aa6de8eb080e0ac318b5ab4cabb9cda92167820f63574fd60e9c94ad25868b82",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-55",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-196 (lines 2057–2058) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-55. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "aa6de8eb080e0ac318b5ab4cabb9cda92167820f63574fd60e9c94ad25868b82",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
User nêu định hướng ưu tiên cho dự án (session `b0010842-aafa-4cf1-9a8a-
6c7f0022d4c7`, 2026-07-28), bản gốc:
```

### Full target unit

```text
User nêu định hướng ưu tiên cho dự án (session `b0010842-aafa-4cf1-9a8a-
6c7f0022d4c7`, 2026-07-28), bản gốc:
```

### Full diff

```diff
No text difference.
```

## claim_f9464aa89f3ee921a37fdc007aa49b88

Source digest: 2ca0942409435a58d4ffa7239de3b766769a3a122b2a81c2991245d0d072cffd

Target digest: 2ca0942409435a58d4ffa7239de3b766769a3a122b2a81c2991245d0d072cffd

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-197",
  "sourceLines": [
    2060,
    2063
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-56",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_8942be62e1a9996fe3b81e97bd5042fb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f9464aa89f3ee921a37fdc007aa49b88",
    "sourceUnitDigest": "2ca0942409435a58d4ffa7239de3b766769a3a122b2a81c2991245d0d072cffd",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-197 (lines 2060–2063) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-56. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2ca0942409435a58d4ffa7239de3b766769a3a122b2a81c2991245d0d072cffd",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
1. Ship faster — phải nhanh trước hết.
2. Better docs — thời AI, làm nhanh mà không có docs thì người khó tham gia
   vào tiến trình đảm bảo better result.
3. Better/stable result.
```

### Full target unit

```text
1. Ship faster — phải nhanh trước hết.
2. Better docs — thời AI, làm nhanh mà không có docs thì người khó tham gia
   vào tiến trình đảm bảo better result.
3. Better/stable result.
```

### Full diff

```diff
No text difference.
```

## claim_815885047389d9a4fdfb9d753114482a

Source digest: bb44fc6910a3131ee1ffdabaa0145acd3cbce3f0d63647d709b665a93354294f

Target digest: bb44fc6910a3131ee1ffdabaa0145acd3cbce3f0d63647d709b665a93354294f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-198",
  "sourceLines": [
    2065,
    2074
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-57",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_4bb76849aa46d36614ee63f2f328679c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_815885047389d9a4fdfb9d753114482a",
    "sourceUnitDigest": "bb44fc6910a3131ee1ffdabaa0145acd3cbce3f0d63647d709b665a93354294f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-57",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-198 (lines 2065–2074) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-57. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "bb44fc6910a3131ee1ffdabaa0145acd3cbce3f0d63647d709b665a93354294f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Phản biện: docs không nên đứng thành 1 bậc ưu tiên riêng tách khỏi result —
"on-eyes" (người đọc-hiểu để tham gia được) cần 2 trụ đồng thời, không phải
xếp tầng: **legibility** (docs) và **verifiability** (kiểm được đúng-sai
thật, không dựa lời khai — result đã verify cho được, docs không cho được).
Tách
riêng khiến "ship nhanh + docs tốt nhưng result chưa verify" đọc như đã đạt
bậc 2, dù chưa đủ tin. Gộp lại thành 1 mệnh đề CoS bắt buộc — **DoD** — đúng
kiểu STR73 đã đòi hỏi cho mọi mệnh đề CoS khác (evidence-link bắt buộc, không
chỉ cho feature-closed). Hạ tầng đối chiếu doc↔source đã có sẵn một phần:
`fgos doc-sources <docPath>` (`bin/fgos.mjs:1149`).
```

### Full target unit

```text
Phản biện: docs không nên đứng thành 1 bậc ưu tiên riêng tách khỏi result —
"on-eyes" (người đọc-hiểu để tham gia được) cần 2 trụ đồng thời, không phải
xếp tầng: **legibility** (docs) và **verifiability** (kiểm được đúng-sai
thật, không dựa lời khai — result đã verify cho được, docs không cho được).
Tách
riêng khiến "ship nhanh + docs tốt nhưng result chưa verify" đọc như đã đạt
bậc 2, dù chưa đủ tin. Gộp lại thành 1 mệnh đề CoS bắt buộc — **DoD** — đúng
kiểu STR73 đã đòi hỏi cho mọi mệnh đề CoS khác (evidence-link bắt buộc, không
chỉ cho feature-closed). Hạ tầng đối chiếu doc↔source đã có sẵn một phần:
`fgos doc-sources <docPath>` (`bin/fgos.mjs:1149`).
```

### Full diff

```diff
No text difference.
```

## claim_cfcf01219968c9c43844432a9bf45106

Source digest: 9e61d7cdb723ab7a1d3186b5071cada36c232dfc859c799ebb1787ffc2ae2062

Target digest: 9e61d7cdb723ab7a1d3186b5071cada36c232dfc859c799ebb1787ffc2ae2062

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-4",
  "sourceLines": [
    2076,
    2076
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
  ],
  "nativeTargetClaimId": "claim_0974f8188fa486324ff4589384ec5e02",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_cfcf01219968c9c43844432a9bf45106",
    "sourceUnitDigest": "9e61d7cdb723ab7a1d3186b5071cada36c232dfc859c799ebb1787ffc2ae2062",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-4 (lines 2076–2076) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9e61d7cdb723ab7a1d3186b5071cada36c232dfc859c799ebb1787ffc2ae2062",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Thứ tự ưu tiên sản phẩm, 3 bậc:

1. **Ship faster** — tốc độ đi trước.
2. **DoD** — result đã verify VÀ docs evidence-linked, cùng một gate (không
   phải 2 bậc riêng: docs không đứng trước hay sau result, mà là điều kiện
   kèm result để tính "xong").
3. **Hoàn thiện sau ngưỡng** (post-threshold polish) — làm result tốt hơn
   mức tối thiểu DoD đã đủ tin, KHÔNG phải mở rộng tính năng/phạm vi.
```

### Full target unit

```text
#### Quyết định

Thứ tự ưu tiên sản phẩm, 3 bậc:

1. **Ship faster** — tốc độ đi trước.
2. **DoD** — result đã verify VÀ docs evidence-linked, cùng một gate (không
   phải 2 bậc riêng: docs không đứng trước hay sau result, mà là điều kiện
   kèm result để tính "xong").
3. **Hoàn thiện sau ngưỡng** (post-threshold polish) — làm result tốt hơn
   mức tối thiểu DoD đã đủ tin, KHÔNG phải mở rộng tính năng/phạm vi.
```

### Full diff

```diff
No text difference.
```

## claim_61a2d3a97785a1fa8dfe590c11569dbb

Source digest: e29bb6605558de71c9a468784b0abf24dfc24e1efcf66437210538d9f3e5db05

Target digest: e29bb6605558de71c9a468784b0abf24dfc24e1efcf66437210538d9f3e5db05

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-199",
  "sourceLines": [
    2078,
    2078
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-58",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_cef2316fc439666ec9a2332f7bbe26ff",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_61a2d3a97785a1fa8dfe590c11569dbb",
    "sourceUnitDigest": "e29bb6605558de71c9a468784b0abf24dfc24e1efcf66437210538d9f3e5db05",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-58",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole unheaded-block docs/specs/runner.md#unheaded-block-199 (lines 2078–2078) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-58. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e29bb6605558de71c9a468784b0abf24dfc24e1efcf66437210538d9f3e5db05",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Thứ tự ưu tiên sản phẩm, 3 bậc:
```

### Full target unit

```text
Thứ tự ưu tiên sản phẩm, 3 bậc:
```

### Full diff

```diff
No text difference.
```

## claim_65654a30d9d13cf2fbea182b95d19049

Source digest: d15c95c7ea56192cc6f4d7c39064c54ce14b7a37db4dd69247c9772a022f1cb6

Target digest: d15c95c7ea56192cc6f4d7c39064c54ce14b7a37db4dd69247c9772a022f1cb6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-200",
  "sourceLines": [
    2080,
    2085
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-59",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_95db7067b386bd0d2d3f9368166bdc48",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_65654a30d9d13cf2fbea182b95d19049",
    "sourceUnitDigest": "d15c95c7ea56192cc6f4d7c39064c54ce14b7a37db4dd69247c9772a022f1cb6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-59",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-200 (lines 2080–2085) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-59. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d15c95c7ea56192cc6f4d7c39064c54ce14b7a37db4dd69247c9772a022f1cb6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
1. **Ship faster** — tốc độ đi trước.
2. **DoD** — result đã verify VÀ docs evidence-linked, cùng một gate (không
   phải 2 bậc riêng: docs không đứng trước hay sau result, mà là điều kiện
   kèm result để tính "xong").
3. **Hoàn thiện sau ngưỡng** (post-threshold polish) — làm result tốt hơn
   mức tối thiểu DoD đã đủ tin, KHÔNG phải mở rộng tính năng/phạm vi.
```

### Full target unit

```text
1. **Ship faster** — tốc độ đi trước.
2. **DoD** — result đã verify VÀ docs evidence-linked, cùng một gate (không
   phải 2 bậc riêng: docs không đứng trước hay sau result, mà là điều kiện
   kèm result để tính "xong").
3. **Hoàn thiện sau ngưỡng** (post-threshold polish) — làm result tốt hơn
   mức tối thiểu DoD đã đủ tin, KHÔNG phải mở rộng tính năng/phạm vi.
```

### Full diff

```diff
No text difference.
```

## claim_34f4766922b81e1632751f0946d57c19

Source digest: 6a6306aef856dae488426e2f9c17c5aa4238d67a541a93b4f82272e68bdc44c3

Target digest: 6a6306aef856dae488426e2f9c17c5aa4238d67a541a93b4f82272e68bdc44c3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-4",
  "sourceLines": [
    2087,
    2087
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
  ],
  "nativeTargetClaimId": "claim_8a7e842f703b12b02aa8a20211f3dd6e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_34f4766922b81e1632751f0946d57c19",
    "sourceUnitDigest": "6a6306aef856dae488426e2f9c17c5aa4238d67a541a93b4f82272e68bdc44c3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-4 (lines 2087–2087) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6a6306aef856dae488426e2f9c17c5aa4238d67a541a93b4f82272e68bdc44c3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- Việc chỉ được coi "xong" (đủ điều kiện đóng) khi qua bậc 2 — result verify
  + docs evidence-linked cùng lúc; thiếu 1 trong 2 không tính là DoD.
- Bậc 3 (polish) chỉ bắt đầu SAU khi bậc 2 đã qua cho đúng lát cắt đó — không
  trộn lẫn polish vào trong khi DoD còn treo, và polish không được mở rộng
  scope/tính năng mới (khác biệt với feature work thật).
```

### Full target unit

```text
#### Hệ quả

- Việc chỉ được coi "xong" (đủ điều kiện đóng) khi qua bậc 2 — result verify
  + docs evidence-linked cùng lúc; thiếu 1 trong 2 không tính là DoD.
- Bậc 3 (polish) chỉ bắt đầu SAU khi bậc 2 đã qua cho đúng lát cắt đó — không
  trộn lẫn polish vào trong khi DoD còn treo, và polish không được mở rộng
  scope/tính năng mới (khác biệt với feature work thật).
```

### Full diff

```diff
No text difference.
```

## claim_191a42c1761f116fda00b3a25ca22d4c

Source digest: b363a680203755fd6ccecd7620eda809e32d4543feabaa9eedba0aac2e2d1b5f

Target digest: b363a680203755fd6ccecd7620eda809e32d4543feabaa9eedba0aac2e2d1b5f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-201",
  "sourceLines": [
    2089,
    2093
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-60",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_e1b7f7909430322d0962740fc7f58e3c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_191a42c1761f116fda00b3a25ca22d4c",
    "sourceUnitDigest": "b363a680203755fd6ccecd7620eda809e32d4543feabaa9eedba0aac2e2d1b5f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-201 (lines 2089–2093) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-60. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b363a680203755fd6ccecd7620eda809e32d4543feabaa9eedba0aac2e2d1b5f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- Việc chỉ được coi "xong" (đủ điều kiện đóng) khi qua bậc 2 — result verify
  + docs evidence-linked cùng lúc; thiếu 1 trong 2 không tính là DoD.
- Bậc 3 (polish) chỉ bắt đầu SAU khi bậc 2 đã qua cho đúng lát cắt đó — không
  trộn lẫn polish vào trong khi DoD còn treo, và polish không được mở rộng
  scope/tính năng mới (khác biệt với feature work thật).
```

### Full target unit

```text
- Việc chỉ được coi "xong" (đủ điều kiện đóng) khi qua bậc 2 — result verify
  + docs evidence-linked cùng lúc; thiếu 1 trong 2 không tính là DoD.
- Bậc 3 (polish) chỉ bắt đầu SAU khi bậc 2 đã qua cho đúng lát cắt đó — không
  trộn lẫn polish vào trong khi DoD còn treo, và polish không được mở rộng
  scope/tính năng mới (khác biệt với feature work thật).
```

### Full diff

```diff
No text difference.
```

## claim_1fea4b6f88d29b497e4695ae53ad21a5

Source digest: 8308c59db81e66797b42ab24e7bc3b432c96beb5abcbca95bcfe6a6bab4befa1

Target digest: 8308c59db81e66797b42ab24e7bc3b432c96beb5abcbca95bcfe6a6bab4befa1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd",
  "sourceLines": [
    2095,
    2095
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_2c0fa8efe300cfcb8c2641b34056b3b2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1fea4b6f88d29b497e4695ae53ad21a5",
    "sourceUnitDigest": "8308c59db81e66797b42ab24e7bc3b432c96beb5abcbca95bcfe6a6bab4befa1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd (lines 2095–2095) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8308c59db81e66797b42ab24e7bc3b432c96beb5abcbca95bcfe6a6bab4befa1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md
```

### Full target unit

```text
### 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md
```

### Full diff

```diff
No text difference.
```

## claim_82480fdae45d11c28fcfddadadcf6f8c

Source digest: 337ae164cf0ab9962947a018e618fb6050db1b0d5f66bdef1833bf5be32fa074

Target digest: 337ae164cf0ab9962947a018e618fb6050db1b0d5f66bdef1833bf5be32fa074

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-6",
  "sourceLines": [
    2097,
    2097
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-6",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "nativeTargetClaimId": "claim_7e81bb0046375cf753ebe5396c06b07d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_82480fdae45d11c28fcfddadadcf6f8c",
    "sourceUnitDigest": "337ae164cf0ab9962947a018e618fb6050db1b0d5f66bdef1833bf5be32fa074",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-6 (lines 2097–2097) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "337ae164cf0ab9962947a018e618fb6050db1b0d5f66bdef1833bf5be32fa074",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`0023` đặt 3 bậc ưu tiên nhưng bậc 1 ("ship faster") không nói rõ tốc độ gì
— chỉ code, hay cả luồng làm việc người-agent. User chốt lại nguyên văn 3
mục (2026-07-30) — ghi đúng, không diễn giải lại:

1. **Ship Faster**: giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux,
   ít chờ đợi.
2. **DoD**: reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD**: hoàn thiện sau ngưỡng, không mở scope.

User hỏi thêm: đưa quyết định này lên đầu, luôn nạp cho mọi agent. Áp
placement test của `0008`'s họ hàng luật L8 (`docs/platform-foundations.md`):
"rule này có cần hold khi không workflow nào đang chạy không?" — có (thứ tự
ưu tiên áp dụng MỌI lúc, không riêng 1 workflow) → phải nằm standing sheet
(`AGENTS.md`, nạp mọi turn qua `CLAUDE.md`'s `@AGENTS.md`), không phải nằm
riêng `docs/decisions/` (nạp theo nhu cầu, dễ bị bỏ qua).
```

### Full target unit

```text
#### Bối cảnh

`0023` đặt 3 bậc ưu tiên nhưng bậc 1 ("ship faster") không nói rõ tốc độ gì
— chỉ code, hay cả luồng làm việc người-agent. User chốt lại nguyên văn 3
mục (2026-07-30) — ghi đúng, không diễn giải lại:

1. **Ship Faster**: giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux,
   ít chờ đợi.
2. **DoD**: reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD**: hoàn thiện sau ngưỡng, không mở scope.

User hỏi thêm: đưa quyết định này lên đầu, luôn nạp cho mọi agent. Áp
placement test của `0008`'s họ hàng luật L8 (`docs/platform-foundations.md`):
"rule này có cần hold khi không workflow nào đang chạy không?" — có (thứ tự
ưu tiên áp dụng MỌI lúc, không riêng 1 workflow) → phải nằm standing sheet
(`AGENTS.md`, nạp mọi turn qua `CLAUDE.md`'s `@AGENTS.md`), không phải nằm
riêng `docs/decisions/` (nạp theo nhu cầu, dễ bị bỏ qua).
```

### Full diff

```diff
No text difference.
```

## claim_ac087152a043ed0200b3a7c9739c85e2

Source digest: 82ae6e2f1cc7e09068ee15c84a13237b9eec8338a2d3d34c33e48b5d47320a94

Target digest: 82ae6e2f1cc7e09068ee15c84a13237b9eec8338a2d3d34c33e48b5d47320a94

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-202",
  "sourceLines": [
    2099,
    2101
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-61",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_2eda28a1b82f85b984079c4a4d8df49e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ac087152a043ed0200b3a7c9739c85e2",
    "sourceUnitDigest": "82ae6e2f1cc7e09068ee15c84a13237b9eec8338a2d3d34c33e48b5d47320a94",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-61",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-202 (lines 2099–2101) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-61. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "82ae6e2f1cc7e09068ee15c84a13237b9eec8338a2d3d34c33e48b5d47320a94",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`0023` đặt 3 bậc ưu tiên nhưng bậc 1 ("ship faster") không nói rõ tốc độ gì
— chỉ code, hay cả luồng làm việc người-agent. User chốt lại nguyên văn 3
mục (2026-07-30) — ghi đúng, không diễn giải lại:
```

### Full target unit

```text
`0023` đặt 3 bậc ưu tiên nhưng bậc 1 ("ship faster") không nói rõ tốc độ gì
— chỉ code, hay cả luồng làm việc người-agent. User chốt lại nguyên văn 3
mục (2026-07-30) — ghi đúng, không diễn giải lại:
```

### Full diff

```diff
No text difference.
```

## claim_8417ee94f21d262eab9e492cb51ec9df

Source digest: 489953164e6ad60e40aab4d100225cc36f04af2e8e23476fe3e92c51d63ed65a

Target digest: 489953164e6ad60e40aab4d100225cc36f04af2e8e23476fe3e92c51d63ed65a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-203",
  "sourceLines": [
    2103,
    2106
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-62",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_06bb232f712f9338ef768d4549a73fa2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8417ee94f21d262eab9e492cb51ec9df",
    "sourceUnitDigest": "489953164e6ad60e40aab4d100225cc36f04af2e8e23476fe3e92c51d63ed65a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-62",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-203 (lines 2103–2106) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-62. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "489953164e6ad60e40aab4d100225cc36f04af2e8e23476fe3e92c51d63ed65a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
1. **Ship Faster**: giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux,
   ít chờ đợi.
2. **DoD**: reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD**: hoàn thiện sau ngưỡng, không mở scope.
```

### Full target unit

```text
1. **Ship Faster**: giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux,
   ít chờ đợi.
2. **DoD**: reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD**: hoàn thiện sau ngưỡng, không mở scope.
```

### Full diff

```diff
No text difference.
```

## claim_dcee9deff7058aad0cd965be27771490

Source digest: 91c176d803c5e1d9fcaa1a1e5cd6f4caaa34ed7a5aabd096375abfd102028d74

Target digest: 91c176d803c5e1d9fcaa1a1e5cd6f4caaa34ed7a5aabd096375abfd102028d74

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-204",
  "sourceLines": [
    2108,
    2113
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-63",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_1a16050f2346d77dd7b4018ab37f9d56",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_dcee9deff7058aad0cd965be27771490",
    "sourceUnitDigest": "91c176d803c5e1d9fcaa1a1e5cd6f4caaa34ed7a5aabd096375abfd102028d74",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-63",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-204 (lines 2108–2113) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-63. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "91c176d803c5e1d9fcaa1a1e5cd6f4caaa34ed7a5aabd096375abfd102028d74",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
User hỏi thêm: đưa quyết định này lên đầu, luôn nạp cho mọi agent. Áp
placement test của `0008`'s họ hàng luật L8 (`docs/platform-foundations.md`):
"rule này có cần hold khi không workflow nào đang chạy không?" — có (thứ tự
ưu tiên áp dụng MỌI lúc, không riêng 1 workflow) → phải nằm standing sheet
(`AGENTS.md`, nạp mọi turn qua `CLAUDE.md`'s `@AGENTS.md`), không phải nằm
riêng `docs/decisions/` (nạp theo nhu cầu, dễ bị bỏ qua).
```

### Full target unit

```text
User hỏi thêm: đưa quyết định này lên đầu, luôn nạp cho mọi agent. Áp
placement test của `0008`'s họ hàng luật L8 (`docs/platform-foundations.md`):
"rule này có cần hold khi không workflow nào đang chạy không?" — có (thứ tự
ưu tiên áp dụng MỌI lúc, không riêng 1 workflow) → phải nằm standing sheet
(`AGENTS.md`, nạp mọi turn qua `CLAUDE.md`'s `@AGENTS.md`), không phải nằm
riêng `docs/decisions/` (nạp theo nhu cầu, dễ bị bỏ qua).
```

### Full diff

```diff
No text difference.
```

## claim_3f39255d8460bbdb8d376bb58688db71

Source digest: e1835ebad72f5b4522351d7504db6f466b96f63a0a7ba2f1d77493d9290c948a

Target digest: e1835ebad72f5b4522351d7504db6f466b96f63a0a7ba2f1d77493d9290c948a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-5",
  "sourceLines": [
    2115,
    2115
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-5",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "nativeTargetClaimId": "claim_28eebabd0809f72167486c1ddad767d3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3f39255d8460bbdb8d376bb58688db71",
    "sourceUnitDigest": "e1835ebad72f5b4522351d7504db6f466b96f63a0a7ba2f1d77493d9290c948a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-5 (lines 2115–2115) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e1835ebad72f5b4522351d7504db6f466b96f63a0a7ba2f1d77493d9290c948a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Nguyên văn 3 mục trên là quyết định — không đổi từ ngữ. Thứ tự CỐ ĐỊNH,
bậc dưới không được ghi đè bậc trên.

Đặt pointer ngắn (3 dòng) vào `AGENTS.md` ngay đầu file, trước "Before
touching code" — always-loaded, mọi agent thấy trước khi chạm code bất kỳ
việc gì. Toàn văn bối cảnh/hệ quả vẫn ở record này (`docs/decisions/0025`);
`AGENTS.md` chỉ giữ 3 dòng + link, không lặp lại lý lẽ.
```

### Full target unit

```text
#### Quyết định

Nguyên văn 3 mục trên là quyết định — không đổi từ ngữ. Thứ tự CỐ ĐỊNH,
bậc dưới không được ghi đè bậc trên.

Đặt pointer ngắn (3 dòng) vào `AGENTS.md` ngay đầu file, trước "Before
touching code" — always-loaded, mọi agent thấy trước khi chạm code bất kỳ
việc gì. Toàn văn bối cảnh/hệ quả vẫn ở record này (`docs/decisions/0025`);
`AGENTS.md` chỉ giữ 3 dòng + link, không lặp lại lý lẽ.
```

### Full diff

```diff
No text difference.
```

## claim_c23434061f64a68f921bd4659db03d4e

Source digest: df9b5c4a1f1f71ecdf4e76ed26570195b22d27d4b541390ec2b1cb8dc71c0caa

Target digest: df9b5c4a1f1f71ecdf4e76ed26570195b22d27d4b541390ec2b1cb8dc71c0caa

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-205",
  "sourceLines": [
    2117,
    2118
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-64",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_f55698cb64af1e7d88c404371dd8533a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c23434061f64a68f921bd4659db03d4e",
    "sourceUnitDigest": "df9b5c4a1f1f71ecdf4e76ed26570195b22d27d4b541390ec2b1cb8dc71c0caa",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-64",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-205 (lines 2117–2118) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-64. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "df9b5c4a1f1f71ecdf4e76ed26570195b22d27d4b541390ec2b1cb8dc71c0caa",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Nguyên văn 3 mục trên là quyết định — không đổi từ ngữ. Thứ tự CỐ ĐỊNH,
bậc dưới không được ghi đè bậc trên.
```

### Full target unit

```text
Nguyên văn 3 mục trên là quyết định — không đổi từ ngữ. Thứ tự CỐ ĐỊNH,
bậc dưới không được ghi đè bậc trên.
```

### Full diff

```diff
No text difference.
```

## claim_b8f3a6e00f6edc0c09f4761cd15afbb7

Source digest: 14455ded4ec0ffb66908ed6a2bdbf9bf4acc9a77c6fefae6c2f0043ab3e42f44

Target digest: 14455ded4ec0ffb66908ed6a2bdbf9bf4acc9a77c6fefae6c2f0043ab3e42f44

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-206",
  "sourceLines": [
    2120,
    2123
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-65",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_2f68630dda9071999e74895ae2bd44b9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b8f3a6e00f6edc0c09f4761cd15afbb7",
    "sourceUnitDigest": "14455ded4ec0ffb66908ed6a2bdbf9bf4acc9a77c6fefae6c2f0043ab3e42f44",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-206 (lines 2120–2123) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-65. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "14455ded4ec0ffb66908ed6a2bdbf9bf4acc9a77c6fefae6c2f0043ab3e42f44",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Đặt pointer ngắn (3 dòng) vào `AGENTS.md` ngay đầu file, trước "Before
touching code" — always-loaded, mọi agent thấy trước khi chạm code bất kỳ
việc gì. Toàn văn bối cảnh/hệ quả vẫn ở record này (`docs/decisions/0025`);
`AGENTS.md` chỉ giữ 3 dòng + link, không lặp lại lý lẽ.
```

### Full target unit

```text
Đặt pointer ngắn (3 dòng) vào `AGENTS.md` ngay đầu file, trước "Before
touching code" — always-loaded, mọi agent thấy trước khi chạm code bất kỳ
việc gì. Toàn văn bối cảnh/hệ quả vẫn ở record này (`docs/decisions/0025`);
`AGENTS.md` chỉ giữ 3 dòng + link, không lặp lại lý lẽ.
```

### Full diff

```diff
No text difference.
```

## claim_a7a07f60563e296d7b435b89f3889787

Source digest: e2b8ec3df45f9427347649d739024782c07610b9db9527048e03239ac4144653

Target digest: e2b8ec3df45f9427347649d739024782c07610b9db9527048e03239ac4144653

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-5",
  "sourceLines": [
    2125,
    2125
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-5",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "nativeTargetClaimId": "claim_6c8c1f0fd9817dff816548d7e190ecab",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a7a07f60563e296d7b435b89f3889787",
    "sourceUnitDigest": "e2b8ec3df45f9427347649d739024782c07610b9db9527048e03239ac4144653",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-5 (lines 2125–2125) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e2b8ec3df45f9427347649d739024782c07610b9db9527048e03239ac4144653",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- `0023` không sửa tại chỗ, chỉ nhận `superseded_by: 0025`.
- `AGENTS.md` có thêm section priority-order — mọi agent mở repo đọc được
  ngay, không cần biết tới `docs/decisions/` mới thấy.
- L8's rule 3 (anchor-suite: mỗi doctrine rule cần cụm từ assert tự động)
  CHƯA làm ở record này — chưa có check tự động xác nhận `AGENTS.md` còn
  giữ đúng 3 mục theo thời gian. Treo lại, không phải phạm vi yêu cầu hiện
  tại.
```

### Full target unit

```text
#### Hệ quả

- `0023` không sửa tại chỗ, chỉ nhận `superseded_by: 0025`.
- `AGENTS.md` có thêm section priority-order — mọi agent mở repo đọc được
  ngay, không cần biết tới `docs/decisions/` mới thấy.
- L8's rule 3 (anchor-suite: mỗi doctrine rule cần cụm từ assert tự động)
  CHƯA làm ở record này — chưa có check tự động xác nhận `AGENTS.md` còn
  giữ đúng 3 mục theo thời gian. Treo lại, không phải phạm vi yêu cầu hiện
  tại.
```

### Full diff

```diff
No text difference.
```

## claim_65786749887af84813c1f796c5a52d38

Source digest: 7ce3bdea52d3d9609416f10af62a47f825f24664c1e3d11de3f8de04aa64ba2c

Target digest: 7ce3bdea52d3d9609416f10af62a47f825f24664c1e3d11de3f8de04aa64ba2c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-207",
  "sourceLines": [
    2127,
    2133
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-66",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_5b354b034f61adc1df6ef71f3abd81cf",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-5",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_65786749887af84813c1f796c5a52d38",
    "sourceUnitDigest": "7ce3bdea52d3d9609416f10af62a47f825f24664c1e3d11de3f8de04aa64ba2c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-207 (lines 2127–2133) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-66. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7ce3bdea52d3d9609416f10af62a47f825f24664c1e3d11de3f8de04aa64ba2c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- `0023` không sửa tại chỗ, chỉ nhận `superseded_by: 0025`.
- `AGENTS.md` có thêm section priority-order — mọi agent mở repo đọc được
  ngay, không cần biết tới `docs/decisions/` mới thấy.
- L8's rule 3 (anchor-suite: mỗi doctrine rule cần cụm từ assert tự động)
  CHƯA làm ở record này — chưa có check tự động xác nhận `AGENTS.md` còn
  giữ đúng 3 mục theo thời gian. Treo lại, không phải phạm vi yêu cầu hiện
  tại.
```

### Full target unit

```text
- `0023` không sửa tại chỗ, chỉ nhận `superseded_by: 0025`.
- `AGENTS.md` có thêm section priority-order — mọi agent mở repo đọc được
  ngay, không cần biết tới `docs/decisions/` mới thấy.
- L8's rule 3 (anchor-suite: mỗi doctrine rule cần cụm từ assert tự động)
  CHƯA làm ở record này — chưa có check tự động xác nhận `AGENTS.md` còn
  giữ đúng 3 mục theo thời gian. Treo lại, không phải phạm vi yêu cầu hiện
  tại.
```

### Full diff

```diff
No text difference.
```

## claim_b6d8e91e3e324b46ed6e14a8f8b15350

Source digest: 3395002bbbad9673076cc5761147e259830826a543af999b57db2cd8be66efb9

Target digest: 3395002bbbad9673076cc5761147e259830826a543af999b57db2cd8be66efb9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "sourceLines": [
    2135,
    2135
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
  ],
  "nativeTargetClaimId": "claim_eb52610fffe256e38542b415e8d6e85d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b6d8e91e3e324b46ed6e14a8f8b15350",
    "sourceUnitDigest": "3395002bbbad9673076cc5761147e259830826a543af999b57db2cd8be66efb9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05 (lines 2135–2135) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3395002bbbad9673076cc5761147e259830826a543af999b57db2cd8be66efb9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md"
    ]
  }
}
```

### Full source unit

```text
#### Làm rõ phạm vi "ai" ship faster (bổ sung 2026-08-05)

Bối cảnh gốc ở trên đã tự nêu câu hỏi ("chỉ code, hay cả luồng làm việc
người-agent") nhưng quyết định lúc đó chỉ chốt NGUYÊN VĂN 3 mục, không trả
lời câu hỏi "ship faster — CỦA AI". Một phiên làm việc thật (`tsk-66o`, 
— mức miễn-kiểm cho `frozen-judge` khi item không khai footprint) hiểu sai
thành "ship faster = fgOS tự triển khai tính năng rẻ/nhanh hơn", khuyến
nghị theo hướng đó — SAI. User chốt lại tường minh:

> "ship faster nghĩa là các project sử dụng tool này để ship phải ship
> được faster (không loại trừ fgos) tuy nhiên nếu tập trung ship fgos
> nhanh hơn mà làm các sản phẩm dùng nó không faster được là không đúng."

**Nguyên văn 3 mục ở "Quyết định" KHÔNG đổi.** Làm rõ thêm, không diễn
giải lại chữ:

- "Ship Faster" đo tốc độ ship của **project ĐANG DÙNG fgOS** để ship sản
  phẩm của họ (agent + người vận hành fgOS trên một repo thật) — KHÔNG
  phải tốc độ tự thân team fgOS build/ship một tính năng của chính fgOS.
- fgOS không bị loại trừ — khi chính fgOS là "project đang ship" (dogfood,
  như repo này), tiêu chí vẫn áp y hệt cho NGƯỜI DÙNG fgOS-trên-fgOS.
- Khi một lựa chọn thiết kế làm fgOS rẻ/nhanh hơn để tự triển khai NHƯNG
  khiến agent/dev đang dùng fgOS trên project thật chậm hơn (noise đọc
  advisory, chờ gate, friction thao tác) — **chọn cái giúp project dùng
  fgOS nhanh hơn**, không phải cái làm fgOS rẻ hơn để build. Chi phí xây
  dựng của chính fgOS nằm ở bậc "Effort to port"/F-score khi cân nhắc
  triển khai, không phải ở tiêu chí Ship Faster này.

Placement test giữ nguyên như bản gốc (standing sheet, `AGENTS.md`, mọi
agent thấy trước khi chạm code) — làm rõ này áp dụng ngay khi đọc, không
cần đợi review threshold riêng.
```

### Full target unit

```text
#### Làm rõ phạm vi "ai" ship faster (bổ sung 2026-08-05)

Bối cảnh gốc ở trên đã tự nêu câu hỏi ("chỉ code, hay cả luồng làm việc
người-agent") nhưng quyết định lúc đó chỉ chốt NGUYÊN VĂN 3 mục, không trả
lời câu hỏi "ship faster — CỦA AI". Một phiên làm việc thật (`tsk-66o`, 
— mức miễn-kiểm cho `frozen-judge` khi item không khai footprint) hiểu sai
thành "ship faster = fgOS tự triển khai tính năng rẻ/nhanh hơn", khuyến
nghị theo hướng đó — SAI. User chốt lại tường minh:

> "ship faster nghĩa là các project sử dụng tool này để ship phải ship
> được faster (không loại trừ fgos) tuy nhiên nếu tập trung ship fgos
> nhanh hơn mà làm các sản phẩm dùng nó không faster được là không đúng."

**Nguyên văn 3 mục ở "Quyết định" KHÔNG đổi.** Làm rõ thêm, không diễn
giải lại chữ:

- "Ship Faster" đo tốc độ ship của **project ĐANG DÙNG fgOS** để ship sản
  phẩm của họ (agent + người vận hành fgOS trên một repo thật) — KHÔNG
  phải tốc độ tự thân team fgOS build/ship một tính năng của chính fgOS.
- fgOS không bị loại trừ — khi chính fgOS là "project đang ship" (dogfood,
  như repo này), tiêu chí vẫn áp y hệt cho NGƯỜI DÙNG fgOS-trên-fgOS.
- Khi một lựa chọn thiết kế làm fgOS rẻ/nhanh hơn để tự triển khai NHƯNG
  khiến agent/dev đang dùng fgOS trên project thật chậm hơn (noise đọc
  advisory, chờ gate, friction thao tác) — **chọn cái giúp project dùng
  fgOS nhanh hơn**, không phải cái làm fgOS rẻ hơn để build. Chi phí xây
  dựng của chính fgOS nằm ở bậc "Effort to port"/F-score khi cân nhắc
  triển khai, không phải ở tiêu chí Ship Faster này.

Placement test giữ nguyên như bản gốc (standing sheet, `AGENTS.md`, mọi
agent thấy trước khi chạm code) — làm rõ này áp dụng ngay khi đọc, không
cần đợi review threshold riêng.
```

### Full diff

```diff
No text difference.
```

## claim_ef0a060c997d60618ebf3ec333100265

Source digest: af3c79e75ff7a5296520bc9fdecad2bfd9656b2f575f0b22383bae3078ff6b8e

Target digest: af3c79e75ff7a5296520bc9fdecad2bfd9656b2f575f0b22383bae3078ff6b8e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-208",
  "sourceLines": [
    2137,
    2142
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-67",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "nativeTargetClaimId": "claim_623cf44c159703aa315d3fde4b96d1f5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ef0a060c997d60618ebf3ec333100265",
    "sourceUnitDigest": "af3c79e75ff7a5296520bc9fdecad2bfd9656b2f575f0b22383bae3078ff6b8e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-208 (lines 2137–2142) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-67. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "af3c79e75ff7a5296520bc9fdecad2bfd9656b2f575f0b22383bae3078ff6b8e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
    ]
  }
}
```

### Full source unit

```text
Bối cảnh gốc ở trên đã tự nêu câu hỏi ("chỉ code, hay cả luồng làm việc
người-agent") nhưng quyết định lúc đó chỉ chốt NGUYÊN VĂN 3 mục, không trả
lời câu hỏi "ship faster — CỦA AI". Một phiên làm việc thật (`tsk-66o`, 
— mức miễn-kiểm cho `frozen-judge` khi item không khai footprint) hiểu sai
thành "ship faster = fgOS tự triển khai tính năng rẻ/nhanh hơn", khuyến
nghị theo hướng đó — SAI. User chốt lại tường minh:
```

### Full target unit

```text
Bối cảnh gốc ở trên đã tự nêu câu hỏi ("chỉ code, hay cả luồng làm việc
người-agent") nhưng quyết định lúc đó chỉ chốt NGUYÊN VĂN 3 mục, không trả
lời câu hỏi "ship faster — CỦA AI". Một phiên làm việc thật (`tsk-66o`, 
— mức miễn-kiểm cho `frozen-judge` khi item không khai footprint) hiểu sai
thành "ship faster = fgOS tự triển khai tính năng rẻ/nhanh hơn", khuyến
nghị theo hướng đó — SAI. User chốt lại tường minh:
```

### Full diff

```diff
No text difference.
```

## claim_e1d151ecdc8f72efa20cced4a6f3f581

Source digest: 2d271cda064ff6505482e8c93268b963eed3977283109dfd18d01de4520c7b54

Target digest: 2d271cda064ff6505482e8c93268b963eed3977283109dfd18d01de4520c7b54

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-209",
  "sourceLines": [
    2144,
    2146
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-68",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "nativeTargetClaimId": "claim_4665dad2cf59df2ea6861add395e1a9e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e1d151ecdc8f72efa20cced4a6f3f581",
    "sourceUnitDigest": "2d271cda064ff6505482e8c93268b963eed3977283109dfd18d01de4520c7b54",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-209 (lines 2144–2146) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-68. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2d271cda064ff6505482e8c93268b963eed3977283109dfd18d01de4520c7b54",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
    ]
  }
}
```

### Full source unit

```text
> "ship faster nghĩa là các project sử dụng tool này để ship phải ship
> được faster (không loại trừ fgos) tuy nhiên nếu tập trung ship fgos
> nhanh hơn mà làm các sản phẩm dùng nó không faster được là không đúng."
```

### Full target unit

```text
> "ship faster nghĩa là các project sử dụng tool này để ship phải ship
> được faster (không loại trừ fgos) tuy nhiên nếu tập trung ship fgos
> nhanh hơn mà làm các sản phẩm dùng nó không faster được là không đúng."
```

### Full diff

```diff
No text difference.
```

## claim_2637ccffa0d84f079f80223b471ee1a6

Source digest: 625ab4ebca05bcb2e57a9c17abbb9dbbe5c567440c9315746c873344be326f27

Target digest: 625ab4ebca05bcb2e57a9c17abbb9dbbe5c567440c9315746c873344be326f27

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-210",
  "sourceLines": [
    2148,
    2149
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-69",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "nativeTargetClaimId": "claim_e463862070c1f665bfae8cdb83cf9659",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2637ccffa0d84f079f80223b471ee1a6",
    "sourceUnitDigest": "625ab4ebca05bcb2e57a9c17abbb9dbbe5c567440c9315746c873344be326f27",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-210 (lines 2148–2149) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-69. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "625ab4ebca05bcb2e57a9c17abbb9dbbe5c567440c9315746c873344be326f27",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
    ]
  }
}
```

### Full source unit

```text
**Nguyên văn 3 mục ở "Quyết định" KHÔNG đổi.** Làm rõ thêm, không diễn
giải lại chữ:
```

### Full target unit

```text
**Nguyên văn 3 mục ở "Quyết định" KHÔNG đổi.** Làm rõ thêm, không diễn
giải lại chữ:
```

### Full diff

```diff
No text difference.
```

## claim_39b334e5c7e4b4310d892cc365fb23ab

Source digest: f7e4f17df716b4cc2c49b51b57efdee84c42b17d1aa49b7be16db298d854bb15

Target digest: f7e4f17df716b4cc2c49b51b57efdee84c42b17d1aa49b7be16db298d854bb15

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-211",
  "sourceLines": [
    2151,
    2161
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-70",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "nativeTargetClaimId": "claim_7745627da94a963ce8c3130a6d6aa54d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_39b334e5c7e4b4310d892cc365fb23ab",
    "sourceUnitDigest": "f7e4f17df716b4cc2c49b51b57efdee84c42b17d1aa49b7be16db298d854bb15",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-211 (lines 2151–2161) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-70. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f7e4f17df716b4cc2c49b51b57efdee84c42b17d1aa49b7be16db298d854bb15",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
    ]
  }
}
```

### Full source unit

```text
- "Ship Faster" đo tốc độ ship của **project ĐANG DÙNG fgOS** để ship sản
  phẩm của họ (agent + người vận hành fgOS trên một repo thật) — KHÔNG
  phải tốc độ tự thân team fgOS build/ship một tính năng của chính fgOS.
- fgOS không bị loại trừ — khi chính fgOS là "project đang ship" (dogfood,
  như repo này), tiêu chí vẫn áp y hệt cho NGƯỜI DÙNG fgOS-trên-fgOS.
- Khi một lựa chọn thiết kế làm fgOS rẻ/nhanh hơn để tự triển khai NHƯNG
  khiến agent/dev đang dùng fgOS trên project thật chậm hơn (noise đọc
  advisory, chờ gate, friction thao tác) — **chọn cái giúp project dùng
  fgOS nhanh hơn**, không phải cái làm fgOS rẻ hơn để build. Chi phí xây
  dựng của chính fgOS nằm ở bậc "Effort to port"/F-score khi cân nhắc
  triển khai, không phải ở tiêu chí Ship Faster này.
```

### Full target unit

```text
- "Ship Faster" đo tốc độ ship của **project ĐANG DÙNG fgOS** để ship sản
  phẩm của họ (agent + người vận hành fgOS trên một repo thật) — KHÔNG
  phải tốc độ tự thân team fgOS build/ship một tính năng của chính fgOS.
- fgOS không bị loại trừ — khi chính fgOS là "project đang ship" (dogfood,
  như repo này), tiêu chí vẫn áp y hệt cho NGƯỜI DÙNG fgOS-trên-fgOS.
- Khi một lựa chọn thiết kế làm fgOS rẻ/nhanh hơn để tự triển khai NHƯNG
  khiến agent/dev đang dùng fgOS trên project thật chậm hơn (noise đọc
  advisory, chờ gate, friction thao tác) — **chọn cái giúp project dùng
  fgOS nhanh hơn**, không phải cái làm fgOS rẻ hơn để build. Chi phí xây
  dựng của chính fgOS nằm ở bậc "Effort to port"/F-score khi cân nhắc
  triển khai, không phải ở tiêu chí Ship Faster này.
```

### Full diff

```diff
No text difference.
```

## claim_f55200ae800f55780d944d1b18a459c8

Source digest: 23a2ca10b604fb5e15a04f952b607ee90e9371636b62be29143e2e8f97837f2b

Target digest: 23a2ca10b604fb5e15a04f952b607ee90e9371636b62be29143e2e8f97837f2b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-212",
  "sourceLines": [
    2163,
    2165
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-71",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
    "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
  ],
  "nativeTargetClaimId": "claim_b7816f7d5806fd09407aa835a0e2da86",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "làm-rõ-phạm-vi-ai-ship-faster-bổ-sung-2026-08-05",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f55200ae800f55780d944d1b18a459c8",
    "sourceUnitDigest": "23a2ca10b604fb5e15a04f952b607ee90e9371636b62be29143e2e8f97837f2b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-212 (lines 2163–2165) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-71. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "23a2ca10b604fb5e15a04f952b607ee90e9371636b62be29143e2e8f97837f2b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md",
      "Làm rõ phạm vi \"ai\" ship faster (bổ sung 2026-08-05)"
    ]
  }
}
```

### Full source unit

```text
Placement test giữ nguyên như bản gốc (standing sheet, `AGENTS.md`, mọi
agent thấy trước khi chạm code) — làm rõ này áp dụng ngay khi đọc, không
cần đợi review threshold riêng.
```

### Full target unit

```text
Placement test giữ nguyên như bản gốc (standing sheet, `AGENTS.md`, mọi
agent thấy trước khi chạm code) — làm rõ này áp dụng ngay khi đọc, không
cần đợi review threshold riêng.
```

### Full diff

```diff
No text difference.
```

## claim_5ecb968b071f9bff993acfbb3fd36127

Source digest: b5feb9dc39066908a13b2af9470dc682055b21f096f7c68e2f64169a72656e6f

Target digest: b5feb9dc39066908a13b2af9470dc682055b21f096f7c68e2f64169a72656e6f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0026-native-first-dispatch-doctrine-launcherroottaskcapacity",
  "sourceLines": [
    2167,
    2167
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0026-native-first-dispatch-doctrine-launcherroottaskcapacity",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_f9a101f2610d360a3bcb8f13c083521c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0026-native-first-dispatch-doctrine-launcherroottaskcapacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5ecb968b071f9bff993acfbb3fd36127",
    "sourceUnitDigest": "b5feb9dc39066908a13b2af9470dc682055b21f096f7c68e2f64169a72656e6f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0026-native-first-dispatch-doctrine-launcherroottaskcapacity",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity (lines 2167–2167) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b5feb9dc39066908a13b2af9470dc682055b21f096f7c68e2f64169a72656e6f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity

**Pinned term: "Native-First Dispatch Doctrine"** — dùng tên này khi
tham chiếu tới toàn bộ vision trong quyết định này (vocabulary
launcher/rootTask/subTask/capacity + 4 quy tắc chọn native vs
cli/spawn dispatch bên dưới), thay vì lặp lại toàn bộ nội dung.
```

### Full target unit

```text
### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity

**Pinned term: "Native-First Dispatch Doctrine"** — dùng tên này khi
tham chiếu tới toàn bộ vision trong quyết định này (vocabulary
launcher/rootTask/subTask/capacity + 4 quy tắc chọn native vs
cli/spawn dispatch bên dưới), thay vì lặp lại toàn bộ nội dung.
```

### Full diff

```diff
No text difference.
```

## claim_1a361f01db5a6e6a64ce5d65a0bfa934

Source digest: 6346dfd3508467a161d9d1e6add6ecf3512c2e6d090c7d5f5992fe6b80122305

Target digest: 6346dfd3508467a161d9d1e6add6ecf3512c2e6d090c7d5f5992fe6b80122305

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-213",
  "sourceLines": [
    2169,
    2172
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-72",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_a30ea4e485d25e32cd68224f3cc8d0e0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0026-native-first-dispatch-doctrine-launcherroottaskcapacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1a361f01db5a6e6a64ce5d65a0bfa934",
    "sourceUnitDigest": "6346dfd3508467a161d9d1e6add6ecf3512c2e6d090c7d5f5992fe6b80122305",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-213 (lines 2169–2172) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-72. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6346dfd3508467a161d9d1e6add6ecf3512c2e6d090c7d5f5992fe6b80122305",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
**Pinned term: "Native-First Dispatch Doctrine"** — dùng tên này khi
tham chiếu tới toàn bộ vision trong quyết định này (vocabulary
launcher/rootTask/subTask/capacity + 4 quy tắc chọn native vs
cli/spawn dispatch bên dưới), thay vì lặp lại toàn bộ nội dung.
```

### Full target unit

```text
**Pinned term: "Native-First Dispatch Doctrine"** — dùng tên này khi
tham chiếu tới toàn bộ vision trong quyết định này (vocabulary
launcher/rootTask/subTask/capacity + 4 quy tắc chọn native vs
cli/spawn dispatch bên dưới), thay vì lặp lại toàn bộ nội dung.
```

### Full diff

```diff
No text difference.
```

## claim_94a01565f18c613f6e7502977d54e6ac

Source digest: 23e631bc21b94f5af0a02cfab78693f61b33d25c52b30ce2e7aa4de386bf2466

Target digest: 23e631bc21b94f5af0a02cfab78693f61b33d25c52b30ce2e7aa4de386bf2466

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-7",
  "sourceLines": [
    2174,
    2174
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-7",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_7f784bdf051e86f8cd8dc9c6ec34f562",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-7",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_94a01565f18c613f6e7502977d54e6ac",
    "sourceUnitDigest": "23e631bc21b94f5af0a02cfab78693f61b33d25c52b30ce2e7aa4de386bf2466",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-7",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-7 (lines 2174–2174) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "23e631bc21b94f5af0a02cfab78693f61b33d25c52b30ce2e7aa4de386bf2466",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

Trong lúc thi công `tsk-3sw` (capacity `agentType` field) và `tsk-53h`
(generalize cli-dispatch-for-cheap-cross-provider-tasks), và trong lúc
truy ra gap thật của `tsk-1ni` (`judgeDiscovery`/`judgeDecompose` luôn
cli/spawn 1 judge mù, kể cả khi caller đã là 1 soul sống cùng provider),
người dùng phát biểu 1 tầm nhìn tổng quát hơn cho toàn bộ cơ chế dispatch
— vượt ra ngoài phạm vi hẹp của 2 item đó. Quyết định này CHỐT tầm nhìn
đó thành văn bản chính thức (đặt tên **Native-First Dispatch Doctrine**),
làm định hướng chung cho mọi item sau này đụng tới dispatch (không tự nó
implement gì).
```

### Full target unit

```text
#### Bối cảnh

Trong lúc thi công `tsk-3sw` (capacity `agentType` field) và `tsk-53h`
(generalize cli-dispatch-for-cheap-cross-provider-tasks), và trong lúc
truy ra gap thật của `tsk-1ni` (`judgeDiscovery`/`judgeDecompose` luôn
cli/spawn 1 judge mù, kể cả khi caller đã là 1 soul sống cùng provider),
người dùng phát biểu 1 tầm nhìn tổng quát hơn cho toàn bộ cơ chế dispatch
— vượt ra ngoài phạm vi hẹp của 2 item đó. Quyết định này CHỐT tầm nhìn
đó thành văn bản chính thức (đặt tên **Native-First Dispatch Doctrine**),
làm định hướng chung cho mọi item sau này đụng tới dispatch (không tự nó
implement gì).
```

### Full diff

```diff
No text difference.
```

## claim_ba1ff7b7666e08aeca20821318df3132

Source digest: 50f7381616a743fa6bc178a79376c38a33c1283047a0f38f2ff2da69ac6dbcec

Target digest: 50f7381616a743fa6bc178a79376c38a33c1283047a0f38f2ff2da69ac6dbcec

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-214",
  "sourceLines": [
    2176,
    2184
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-73",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_a2b822698ea19a0feb6d6796dd8bc164",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-7",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ba1ff7b7666e08aeca20821318df3132",
    "sourceUnitDigest": "50f7381616a743fa6bc178a79376c38a33c1283047a0f38f2ff2da69ac6dbcec",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-214 (lines 2176–2184) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-73. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "50f7381616a743fa6bc178a79376c38a33c1283047a0f38f2ff2da69ac6dbcec",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Trong lúc thi công `tsk-3sw` (capacity `agentType` field) và `tsk-53h`
(generalize cli-dispatch-for-cheap-cross-provider-tasks), và trong lúc
truy ra gap thật của `tsk-1ni` (`judgeDiscovery`/`judgeDecompose` luôn
cli/spawn 1 judge mù, kể cả khi caller đã là 1 soul sống cùng provider),
người dùng phát biểu 1 tầm nhìn tổng quát hơn cho toàn bộ cơ chế dispatch
— vượt ra ngoài phạm vi hẹp của 2 item đó. Quyết định này CHỐT tầm nhìn
đó thành văn bản chính thức (đặt tên **Native-First Dispatch Doctrine**),
làm định hướng chung cho mọi item sau này đụng tới dispatch (không tự nó
implement gì).
```

### Full target unit

```text
Trong lúc thi công `tsk-3sw` (capacity `agentType` field) và `tsk-53h`
(generalize cli-dispatch-for-cheap-cross-provider-tasks), và trong lúc
truy ra gap thật của `tsk-1ni` (`judgeDiscovery`/`judgeDecompose` luôn
cli/spawn 1 judge mù, kể cả khi caller đã là 1 soul sống cùng provider),
người dùng phát biểu 1 tầm nhìn tổng quát hơn cho toàn bộ cơ chế dispatch
— vượt ra ngoài phạm vi hẹp của 2 item đó. Quyết định này CHỐT tầm nhìn
đó thành văn bản chính thức (đặt tên **Native-First Dispatch Doctrine**),
làm định hướng chung cho mọi item sau này đụng tới dispatch (không tự nó
implement gì).
```

### Full diff

```diff
No text difference.
```

## claim_9c4e625714d537e186cddc9ec62ae473

Source digest: f2dbf6f92ba2d466ecbe8d9f4416f78fbb4cc4eccec3d67038e6df42067258d6

Target digest: f2dbf6f92ba2d466ecbe8d9f4416f78fbb4cc4eccec3d67038e6df42067258d6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "sourceLines": [
    2186,
    2186
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_78493494c116c5c3c834eee3c5265106",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9c4e625714d537e186cddc9ec62ae473",
    "sourceUnitDigest": "f2dbf6f92ba2d466ecbe8d9f4416f78fbb4cc4eccec3d67038e6df42067258d6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây (lines 2186–2186) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f2dbf6f92ba2d466ecbe8d9f4416f78fbb4cc4eccec3d67038e6df42067258d6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)

- **launcher** — tiến trình/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask,
  qua HOẶC 1 agent-terminal (tương tác) HOẶC 1 headless/non-interactive
  agent process (spawn/cli). Là 1 VAI TRÒ, không phải 1 phần mềm cụ thể
  duy nhất — nhiều cơ chế khác nhau đều đóng vai này:
  - Người dùng tự tay mở 1 session Claude Code/Codex/agy tương tác —
    chính người dùng là launcher.
  - `/fgOS:pick`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
    `/fgOS:cleanup-loop`, `/fgOS:retro-loop` — các skill lặp, chạy BÊN
    TRONG 1 session tương tác đang sống, lần lượt kích hoạt/đưa nhiều
    rootTask qua vòng đời của chúng.
  - `fgos-runner` (`bin/fgos-runner.mjs`/`loop.mjs`) — launcher
    HEADLESS, không cần người ngồi terminal — hình dung là tương lai khi
    không cần thao tác tay nhiều nữa, tự claim + spawn worker headless
    cho từng rootTask.
  - `herdr-dashboard` (quản lý pane/tab terminal) — hạ tầng để đứng 1
    agent-terminal lên (tìm/mở pane), CÓ THỂ được 1 launcher dùng để
    đứng rootTask lên, và tự nó cũng có thể được bọc thành 1 launcher
    (ví dụ 1 automation dùng herdr mở N pane, mỗi pane chạy 1 rootTask).
  - **Vai trò launcher KHÔNG CẦN soul** — logic chọn "item nào tiếp
    theo" (FIFO picker, frontier, priority ranking...) giữ THUẦN CƠ HỌC,
 đúng tinh thần "trí tuệ không cầm picker" (`fgos-routing`'s own 
    stance) đã có sẵn trong repo. Soul chỉ vào cuộc SAU KHI launcher
    đã quyết định kích hoạt rootTask nào.

- **rootTask** — công việc gốc đang làm, được bao bọc/vận hành bởi 1
  agent-terminal (tương tác) hoặc 1 headless agent process. Vai trò này
  có tính ĐỆ QUY/fractal, không cố định ở 1 tầng: bất kỳ ai đang là "host"
  thực thi cho 1 việc, tại thời điểm nó tự kích hoạt việc con bên dưới,
  chính nó lại đóng vai rootTask cho những việc con đó (khớp
  `tsk-53h`'s nesting rule đã pin: 1 `claude` bị spawn qua cli/spawn, một
  khi đã chạy, chính nó lại là 1 Claude Code agent loop thật, có thể tiếp
  tục dispatch xuống 1 tầng nữa).

- **subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG bản chất chỉ là 1
  **rootTask** khác, được kích hoạt đệ quy bởi rootTask hiện tại (khớp
  đúng tính đệ quy/fractal đã nói ở trên — "subTask" chỉ là tên gọi
  tương đối, nhìn từ góc của bên kích hoạt).

- **capacity** — KHÁC bản chất với subTask: là 1 đơn vị functional/helper
  hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời
  1 rootTask đầy đủ.

  **subTask và capacity KHÔNG gộp thành 1 khái niệm** (đính chính lại
  phát biểu ban đầu) — chúng khác nhau thật về bản chất (1 bên là
  rootTask đệ quy, 1 bên là helper). Cái GIỐNG NHAU, và là điều đáng nói,
  là **CƠ CHẾ DISPATCH/LAUNCH**: quyết định "kích hoạt bằng gì" (native
  hay cli/spawn, theo 4 quy tắc dưới) áp dụng Y HỆT cho cả 2 — bên kích
  hoạt không cần quan tâm target là 1 rootTask-con hay 1 helper, chỉ cần
  biết: có cần soul không, cùng provider không, có cơ chế native tương
  ứng không, config có ép cli/spawn không. Từ góc nhìn cơ chế dispatch
  (không phải góc nhìn khái niệm), coi cả 2 là "đối tượng bị kích hoạt"
  chung 1 quyết định là hợp lý — nhưng đó là hợp nhất Ở TẦNG CƠ CHẾ, chưa
  từng có ý gộp bản chất 2 khái niệm làm một.
```

### Full target unit

```text
#### Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)

- **launcher** — tiến trình/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask,
  qua HOẶC 1 agent-terminal (tương tác) HOẶC 1 headless/non-interactive
  agent process (spawn/cli). Là 1 VAI TRÒ, không phải 1 phần mềm cụ thể
  duy nhất — nhiều cơ chế khác nhau đều đóng vai này:
  - Người dùng tự tay mở 1 session Claude Code/Codex/agy tương tác —
    chính người dùng là launcher.
  - `/fgOS:pick`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
    `/fgOS:cleanup-loop`, `/fgOS:retro-loop` — các skill lặp, chạy BÊN
    TRONG 1 session tương tác đang sống, lần lượt kích hoạt/đưa nhiều
    rootTask qua vòng đời của chúng.
  - `fgos-runner` (`bin/fgos-runner.mjs`/`loop.mjs`) — launcher
    HEADLESS, không cần người ngồi terminal — hình dung là tương lai khi
    không cần thao tác tay nhiều nữa, tự claim + spawn worker headless
    cho từng rootTask.
  - `herdr-dashboard` (quản lý pane/tab terminal) — hạ tầng để đứng 1
    agent-terminal lên (tìm/mở pane), CÓ THỂ được 1 launcher dùng để
    đứng rootTask lên, và tự nó cũng có thể được bọc thành 1 launcher
    (ví dụ 1 automation dùng herdr mở N pane, mỗi pane chạy 1 rootTask).
  - **Vai trò launcher KHÔNG CẦN soul** — logic chọn "item nào tiếp
    theo" (FIFO picker, frontier, priority ranking...) giữ THUẦN CƠ HỌC,
 đúng tinh thần "trí tuệ không cầm picker" (`fgos-routing`'s own 
    stance) đã có sẵn trong repo. Soul chỉ vào cuộc SAU KHI launcher
    đã quyết định kích hoạt rootTask nào.

- **rootTask** — công việc gốc đang làm, được bao bọc/vận hành bởi 1
  agent-terminal (tương tác) hoặc 1 headless agent process. Vai trò này
  có tính ĐỆ QUY/fractal, không cố định ở 1 tầng: bất kỳ ai đang là "host"
  thực thi cho 1 việc, tại thời điểm nó tự kích hoạt việc con bên dưới,
  chính nó lại đóng vai rootTask cho những việc con đó (khớp
  `tsk-53h`'s nesting rule đã pin: 1 `claude` bị spawn qua cli/spawn, một
  khi đã chạy, chính nó lại là 1 Claude Code agent loop thật, có thể tiếp
  tục dispatch xuống 1 tầng nữa).

- **subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG bản chất chỉ là 1
  **rootTask** khác, được kích hoạt đệ quy bởi rootTask hiện tại (khớp
  đúng tính đệ quy/fractal đã nói ở trên — "subTask" chỉ là tên gọi
  tương đối, nhìn từ góc của bên kích hoạt).

- **capacity** — KHÁC bản chất với subTask: là 1 đơn vị functional/helper
  hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời
  1 rootTask đầy đủ.

  **subTask và capacity KHÔNG gộp thành 1 khái niệm** (đính chính lại
  phát biểu ban đầu) — chúng khác nhau thật về bản chất (1 bên là
  rootTask đệ quy, 1 bên là helper). Cái GIỐNG NHAU, và là điều đáng nói,
  là **CƠ CHẾ DISPATCH/LAUNCH**: quyết định "kích hoạt bằng gì" (native
  hay cli/spawn, theo 4 quy tắc dưới) áp dụng Y HỆT cho cả 2 — bên kích
  hoạt không cần quan tâm target là 1 rootTask-con hay 1 helper, chỉ cần
  biết: có cần soul không, cùng provider không, có cơ chế native tương
  ứng không, config có ép cli/spawn không. Từ góc nhìn cơ chế dispatch
  (không phải góc nhìn khái niệm), coi cả 2 là "đối tượng bị kích hoạt"
  chung 1 quyết định là hợp lý — nhưng đó là hợp nhất Ở TẦNG CƠ CHẾ, chưa
  từng có ý gộp bản chất 2 khái niệm làm một.
```

### Full diff

```diff
No text difference.
```

## claim_f461a9f790d3acb7c125568c286f05a4

Source digest: 8f7b3fb60770f10ec9214bfac1449a12f7ae1f848ee0986727c95c77e7f89892

Target digest: 8f7b3fb60770f10ec9214bfac1449a12f7ae1f848ee0986727c95c77e7f89892

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-215",
  "sourceLines": [
    2188,
    2210
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-74",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "nativeTargetClaimId": "claim_4e9d8ade1725ace19280301f5e4809b5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f461a9f790d3acb7c125568c286f05a4",
    "sourceUnitDigest": "8f7b3fb60770f10ec9214bfac1449a12f7ae1f848ee0986727c95c77e7f89892",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-215 (lines 2188–2210) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-74. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8f7b3fb60770f10ec9214bfac1449a12f7ae1f848ee0986727c95c77e7f89892",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
    ]
  }
}
```

### Full source unit

```text
- **launcher** — tiến trình/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask,
  qua HOẶC 1 agent-terminal (tương tác) HOẶC 1 headless/non-interactive
  agent process (spawn/cli). Là 1 VAI TRÒ, không phải 1 phần mềm cụ thể
  duy nhất — nhiều cơ chế khác nhau đều đóng vai này:
  - Người dùng tự tay mở 1 session Claude Code/Codex/agy tương tác —
    chính người dùng là launcher.
  - `/fgOS:pick`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
    `/fgOS:cleanup-loop`, `/fgOS:retro-loop` — các skill lặp, chạy BÊN
    TRONG 1 session tương tác đang sống, lần lượt kích hoạt/đưa nhiều
    rootTask qua vòng đời của chúng.
  - `fgos-runner` (`bin/fgos-runner.mjs`/`loop.mjs`) — launcher
    HEADLESS, không cần người ngồi terminal — hình dung là tương lai khi
    không cần thao tác tay nhiều nữa, tự claim + spawn worker headless
    cho từng rootTask.
  - `herdr-dashboard` (quản lý pane/tab terminal) — hạ tầng để đứng 1
    agent-terminal lên (tìm/mở pane), CÓ THỂ được 1 launcher dùng để
    đứng rootTask lên, và tự nó cũng có thể được bọc thành 1 launcher
    (ví dụ 1 automation dùng herdr mở N pane, mỗi pane chạy 1 rootTask).
  - **Vai trò launcher KHÔNG CẦN soul** — logic chọn "item nào tiếp
    theo" (FIFO picker, frontier, priority ranking...) giữ THUẦN CƠ HỌC,
 đúng tinh thần "trí tuệ không cầm picker" (`fgos-routing`'s own 
    stance) đã có sẵn trong repo. Soul chỉ vào cuộc SAU KHI launcher
    đã quyết định kích hoạt rootTask nào.
```

### Full target unit

```text
- **launcher** — tiến trình/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask,
  qua HOẶC 1 agent-terminal (tương tác) HOẶC 1 headless/non-interactive
  agent process (spawn/cli). Là 1 VAI TRÒ, không phải 1 phần mềm cụ thể
  duy nhất — nhiều cơ chế khác nhau đều đóng vai này:
  - Người dùng tự tay mở 1 session Claude Code/Codex/agy tương tác —
    chính người dùng là launcher.
  - `/fgOS:pick`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
    `/fgOS:cleanup-loop`, `/fgOS:retro-loop` — các skill lặp, chạy BÊN
    TRONG 1 session tương tác đang sống, lần lượt kích hoạt/đưa nhiều
    rootTask qua vòng đời của chúng.
  - `fgos-runner` (`bin/fgos-runner.mjs`/`loop.mjs`) — launcher
    HEADLESS, không cần người ngồi terminal — hình dung là tương lai khi
    không cần thao tác tay nhiều nữa, tự claim + spawn worker headless
    cho từng rootTask.
  - `herdr-dashboard` (quản lý pane/tab terminal) — hạ tầng để đứng 1
    agent-terminal lên (tìm/mở pane), CÓ THỂ được 1 launcher dùng để
    đứng rootTask lên, và tự nó cũng có thể được bọc thành 1 launcher
    (ví dụ 1 automation dùng herdr mở N pane, mỗi pane chạy 1 rootTask).
  - **Vai trò launcher KHÔNG CẦN soul** — logic chọn "item nào tiếp
    theo" (FIFO picker, frontier, priority ranking...) giữ THUẦN CƠ HỌC,
 đúng tinh thần "trí tuệ không cầm picker" (`fgos-routing`'s own 
    stance) đã có sẵn trong repo. Soul chỉ vào cuộc SAU KHI launcher
    đã quyết định kích hoạt rootTask nào.
```

### Full diff

```diff
No text difference.
```

## claim_d5143ddef51fde2e51f8743fa3e87b64

Source digest: 640fccdd3ea568a91b0f8c7062328a0abd72aa77f662ede57733c4b909d344fd

Target digest: 640fccdd3ea568a91b0f8c7062328a0abd72aa77f662ede57733c4b909d344fd

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-216",
  "sourceLines": [
    2212,
    2219
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-75",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "nativeTargetClaimId": "claim_69a9b884baf2b3d1b74fe6d1397f8908",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d5143ddef51fde2e51f8743fa3e87b64",
    "sourceUnitDigest": "640fccdd3ea568a91b0f8c7062328a0abd72aa77f662ede57733c4b909d344fd",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-216 (lines 2212–2219) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-75. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "640fccdd3ea568a91b0f8c7062328a0abd72aa77f662ede57733c4b909d344fd",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
    ]
  }
}
```

### Full source unit

```text
- **rootTask** — công việc gốc đang làm, được bao bọc/vận hành bởi 1
  agent-terminal (tương tác) hoặc 1 headless agent process. Vai trò này
  có tính ĐỆ QUY/fractal, không cố định ở 1 tầng: bất kỳ ai đang là "host"
  thực thi cho 1 việc, tại thời điểm nó tự kích hoạt việc con bên dưới,
  chính nó lại đóng vai rootTask cho những việc con đó (khớp
  `tsk-53h`'s nesting rule đã pin: 1 `claude` bị spawn qua cli/spawn, một
  khi đã chạy, chính nó lại là 1 Claude Code agent loop thật, có thể tiếp
  tục dispatch xuống 1 tầng nữa).
```

### Full target unit

```text
- **rootTask** — công việc gốc đang làm, được bao bọc/vận hành bởi 1
  agent-terminal (tương tác) hoặc 1 headless agent process. Vai trò này
  có tính ĐỆ QUY/fractal, không cố định ở 1 tầng: bất kỳ ai đang là "host"
  thực thi cho 1 việc, tại thời điểm nó tự kích hoạt việc con bên dưới,
  chính nó lại đóng vai rootTask cho những việc con đó (khớp
  `tsk-53h`'s nesting rule đã pin: 1 `claude` bị spawn qua cli/spawn, một
  khi đã chạy, chính nó lại là 1 Claude Code agent loop thật, có thể tiếp
  tục dispatch xuống 1 tầng nữa).
```

### Full diff

```diff
No text difference.
```

## claim_b1f4c90d19ab3249e717f89facdbde86

Source digest: e549d17ef59f5ab0bb8fb6136dad9acd3ff79d97d7ea3d0acd97c8f8fda08467

Target digest: e549d17ef59f5ab0bb8fb6136dad9acd3ff79d97d7ea3d0acd97c8f8fda08467

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-217",
  "sourceLines": [
    2221,
    2224
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-76",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "nativeTargetClaimId": "claim_3a580f48462245f3baf9242f4f108a6b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b1f4c90d19ab3249e717f89facdbde86",
    "sourceUnitDigest": "e549d17ef59f5ab0bb8fb6136dad9acd3ff79d97d7ea3d0acd97c8f8fda08467",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-217 (lines 2221–2224) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-76. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e549d17ef59f5ab0bb8fb6136dad9acd3ff79d97d7ea3d0acd97c8f8fda08467",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
    ]
  }
}
```

### Full source unit

```text
- **subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG bản chất chỉ là 1
  **rootTask** khác, được kích hoạt đệ quy bởi rootTask hiện tại (khớp
  đúng tính đệ quy/fractal đã nói ở trên — "subTask" chỉ là tên gọi
  tương đối, nhìn từ góc của bên kích hoạt).
```

### Full target unit

```text
- **subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG bản chất chỉ là 1
  **rootTask** khác, được kích hoạt đệ quy bởi rootTask hiện tại (khớp
  đúng tính đệ quy/fractal đã nói ở trên — "subTask" chỉ là tên gọi
  tương đối, nhìn từ góc của bên kích hoạt).
```

### Full diff

```diff
No text difference.
```

## claim_91f16f1801511650e3092f03db9a7c19

Source digest: c0a1590d39ace5a749f914ac4a5ee7c782a61d5d0aeccfab735e696c21e2a719

Target digest: c0a1590d39ace5a749f914ac4a5ee7c782a61d5d0aeccfab735e696c21e2a719

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-218",
  "sourceLines": [
    2226,
    2228
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-77",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "nativeTargetClaimId": "claim_e77a54b2503cb9c506da1b8cef282d0f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_91f16f1801511650e3092f03db9a7c19",
    "sourceUnitDigest": "c0a1590d39ace5a749f914ac4a5ee7c782a61d5d0aeccfab735e696c21e2a719",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-218 (lines 2226–2228) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-77. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c0a1590d39ace5a749f914ac4a5ee7c782a61d5d0aeccfab735e696c21e2a719",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
    ]
  }
}
```

### Full source unit

```text
- **capacity** — KHÁC bản chất với subTask: là 1 đơn vị functional/helper
  hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời
  1 rootTask đầy đủ.
```

### Full target unit

```text
- **capacity** — KHÁC bản chất với subTask: là 1 đơn vị functional/helper
  hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời
  1 rootTask đầy đủ.
```

### Full diff

```diff
No text difference.
```

## claim_7482a6b245a0f7034787e7d8bd0b7d24

Source digest: 5f1b6974897e3f2bfb45fb3ab15ae66efccab69af5237d752408399ae5c4408f

Target digest: 5f1b6974897e3f2bfb45fb3ab15ae66efccab69af5237d752408399ae5c4408f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-219",
  "sourceLines": [
    2230,
    2240
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-78",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
  ],
  "nativeTargetClaimId": "claim_e7f5c0751730c145af3471261a07aa55",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "đơn-vị-vận-hành-vocabulary-chốt-dùng-xuyên-suốt-từ-đây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_7482a6b245a0f7034787e7d8bd0b7d24",
    "sourceUnitDigest": "5f1b6974897e3f2bfb45fb3ab15ae66efccab69af5237d752408399ae5c4408f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-219 (lines 2230–2240) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-78. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5f1b6974897e3f2bfb45fb3ab15ae66efccab69af5237d752408399ae5c4408f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)"
    ]
  }
}
```

### Full source unit

```text
**subTask và capacity KHÔNG gộp thành 1 khái niệm** (đính chính lại
  phát biểu ban đầu) — chúng khác nhau thật về bản chất (1 bên là
  rootTask đệ quy, 1 bên là helper). Cái GIỐNG NHAU, và là điều đáng nói,
  là **CƠ CHẾ DISPATCH/LAUNCH**: quyết định "kích hoạt bằng gì" (native
  hay cli/spawn, theo 4 quy tắc dưới) áp dụng Y HỆT cho cả 2 — bên kích
  hoạt không cần quan tâm target là 1 rootTask-con hay 1 helper, chỉ cần
  biết: có cần soul không, cùng provider không, có cơ chế native tương
  ứng không, config có ép cli/spawn không. Từ góc nhìn cơ chế dispatch
  (không phải góc nhìn khái niệm), coi cả 2 là "đối tượng bị kích hoạt"
  chung 1 quyết định là hợp lý — nhưng đó là hợp nhất Ở TẦNG CƠ CHẾ, chưa
  từng có ý gộp bản chất 2 khái niệm làm một.
```

### Full target unit

```text
**subTask và capacity KHÔNG gộp thành 1 khái niệm** (đính chính lại
  phát biểu ban đầu) — chúng khác nhau thật về bản chất (1 bên là
  rootTask đệ quy, 1 bên là helper). Cái GIỐNG NHAU, và là điều đáng nói,
  là **CƠ CHẾ DISPATCH/LAUNCH**: quyết định "kích hoạt bằng gì" (native
  hay cli/spawn, theo 4 quy tắc dưới) áp dụng Y HỆT cho cả 2 — bên kích
  hoạt không cần quan tâm target là 1 rootTask-con hay 1 helper, chỉ cần
  biết: có cần soul không, cùng provider không, có cơ chế native tương
  ứng không, config có ép cli/spawn không. Từ góc nhìn cơ chế dispatch
  (không phải góc nhìn khái niệm), coi cả 2 là "đối tượng bị kích hoạt"
  chung 1 quyết định là hợp lý — nhưng đó là hợp nhất Ở TẦNG CƠ CHẾ, chưa
  từng có ý gộp bản chất 2 khái niệm làm một.
```

### Full diff

```diff
No text difference.
```

## claim_60fa2dd65b4761863bd7399ade02f9c6

Source digest: f1aa6cca2ce7b982e026e4827859149b12fdbb5d226ff76cadf3fa1f0830be8f

Target digest: f1aa6cca2ce7b982e026e4827859149b12fdbb5d226ff76cadf3fa1f0830be8f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "sourceLines": [
    2242,
    2242
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_36f9c34ccde23750082911eff403dd56",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_60fa2dd65b4761863bd7399ade02f9c6",
    "sourceUnitDigest": "f1aa6cca2ce7b982e026e4827859149b12fdbb5d226ff76cadf3fa1f0830be8f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity (lines 2242–2242) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f1aa6cca2ce7b982e026e4827859149b12fdbb5d226ff76cadf3fa1f0830be8f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)

1. **Target thuần cơ học** (không cần suy luận/soul) → luôn cli/spawn.
   Hiển nhiên, không có lựa chọn khác, không tranh cãi.

2. **Target cần soul, CÙNG provider với rootTask đang chạy** → ưu tiên
   cơ chế NATIVE của chính provider đó (Claude: Task/SubAgent/Team; agy:
   `--agent` + cơ chế subagent nội bộ của riêng nó — xác nhận thật qua
   changelog agy: "subagent_info payload for delegated subagents...
   nested subagents (grandchild and deeper)" — agy có khái niệm
   native-subagent-trong-session y hệt Claude, không chỉ mỗi CLI flag
   `--agent`). Đây là **native dispatch** — tên tổng quát hoá của
   "task-dispatch" (`tsk-53h`) ra khỏi phạm vi riêng Claude, cho MỌI
   provider có cơ chế in-process của riêng nó.

   **Thu hẹp bởi `0033` (2026-08-16):** quy tắc 2 chỉ còn đúng cho
   capacity **agentType-shaped** (chỉ có `agentType`, không có `command`/
   `invocations` riêng — honoring nó `in-process` CHÍNH LÀ honoring cấu
   hình). Một capacity **cli-spawn-shaped** (có `command`/`invocations`
   riêng, ví dụ `agy`) giờ LUÔN cli/spawn khi đã cấu hình, kể cả khi
   caller cùng provider và có sẵn native mechanism — quyết định người
   dùng trực tiếp, xem `0033` cho lý do đầy đủ.

3. **Target cần soul, KHÁC provider với rootTask đang chạy** → bắt buộc
   cli/spawn (**cli/spawn dispatch** — tên giữ nguyên nghĩa "cli-dispatch"
   cũ). Không có ngoại lệ hôm nay — chưa provider nào hỗ trợ native
   cross-provider (Claude's Task tool chỉ chọn được model Claude, không
   gọi được binary khác — đã xác nhận qua `--model`/`--agent` help text
   lẫn `tsk-53h`'s locked fact).

4. **Ngoại lệ hợp lệ, không phải bug:** config có thể ép 1 target cùng
   provider vẫn phải cli/spawn, cho mục đích riêng (ví dụ: cách ly tài
   nguyên, cần chạy trong worktree/cwd khác, cần 1 tiến trình độc lập
   hoàn toàn không chia sẻ context). `tsk-3sw`'s `agentType` field
   (headless-runner spawn `claude --agent <name>`) CHÍNH LÀ case này —
   hợp lệ, không sai, không bị tầm nhìn này phủ nhận.
```

### Full target unit

```text
#### Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)

1. **Target thuần cơ học** (không cần suy luận/soul) → luôn cli/spawn.
   Hiển nhiên, không có lựa chọn khác, không tranh cãi.

2. **Target cần soul, CÙNG provider với rootTask đang chạy** → ưu tiên
   cơ chế NATIVE của chính provider đó (Claude: Task/SubAgent/Team; agy:
   `--agent` + cơ chế subagent nội bộ của riêng nó — xác nhận thật qua
   changelog agy: "subagent_info payload for delegated subagents...
   nested subagents (grandchild and deeper)" — agy có khái niệm
   native-subagent-trong-session y hệt Claude, không chỉ mỗi CLI flag
   `--agent`). Đây là **native dispatch** — tên tổng quát hoá của
   "task-dispatch" (`tsk-53h`) ra khỏi phạm vi riêng Claude, cho MỌI
   provider có cơ chế in-process của riêng nó.

   **Thu hẹp bởi `0033` (2026-08-16):** quy tắc 2 chỉ còn đúng cho
   capacity **agentType-shaped** (chỉ có `agentType`, không có `command`/
   `invocations` riêng — honoring nó `in-process` CHÍNH LÀ honoring cấu
   hình). Một capacity **cli-spawn-shaped** (có `command`/`invocations`
   riêng, ví dụ `agy`) giờ LUÔN cli/spawn khi đã cấu hình, kể cả khi
   caller cùng provider và có sẵn native mechanism — quyết định người
   dùng trực tiếp, xem `0033` cho lý do đầy đủ.

3. **Target cần soul, KHÁC provider với rootTask đang chạy** → bắt buộc
   cli/spawn (**cli/spawn dispatch** — tên giữ nguyên nghĩa "cli-dispatch"
   cũ). Không có ngoại lệ hôm nay — chưa provider nào hỗ trợ native
   cross-provider (Claude's Task tool chỉ chọn được model Claude, không
   gọi được binary khác — đã xác nhận qua `--model`/`--agent` help text
   lẫn `tsk-53h`'s locked fact).

4. **Ngoại lệ hợp lệ, không phải bug:** config có thể ép 1 target cùng
   provider vẫn phải cli/spawn, cho mục đích riêng (ví dụ: cách ly tài
   nguyên, cần chạy trong worktree/cwd khác, cần 1 tiến trình độc lập
   hoàn toàn không chia sẻ context). `tsk-3sw`'s `agentType` field
   (headless-runner spawn `claude --agent <name>`) CHÍNH LÀ case này —
   hợp lệ, không sai, không bị tầm nhìn này phủ nhận.
```

### Full diff

```diff
No text difference.
```

## claim_f5f5082cfab9ed213a69e6329a943711

Source digest: 0902644a454dd8a73de62274e212a23ac75f5c715277dd0dbbfc7d03843920ae

Target digest: 0902644a454dd8a73de62274e212a23ac75f5c715277dd0dbbfc7d03843920ae

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-220",
  "sourceLines": [
    2244,
    2245
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-79",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "nativeTargetClaimId": "claim_c508273fe3356009c577596d4d88e0e7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f5f5082cfab9ed213a69e6329a943711",
    "sourceUnitDigest": "0902644a454dd8a73de62274e212a23ac75f5c715277dd0dbbfc7d03843920ae",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-220 (lines 2244–2245) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-79. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0902644a454dd8a73de62274e212a23ac75f5c715277dd0dbbfc7d03843920ae",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
    ]
  }
}
```

### Full source unit

```text
1. **Target thuần cơ học** (không cần suy luận/soul) → luôn cli/spawn.
   Hiển nhiên, không có lựa chọn khác, không tranh cãi.
```

### Full target unit

```text
1. **Target thuần cơ học** (không cần suy luận/soul) → luôn cli/spawn.
   Hiển nhiên, không có lựa chọn khác, không tranh cãi.
```

### Full diff

```diff
No text difference.
```

## claim_399a6a1ad4caf2bbe46bc11bc69083dc

Source digest: 8d685ffb0bc4da547ccbd34385eba75fc934b49dbd81f49245488bb977e93d4b

Target digest: 8d685ffb0bc4da547ccbd34385eba75fc934b49dbd81f49245488bb977e93d4b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-221",
  "sourceLines": [
    2247,
    2255
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-80",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "nativeTargetClaimId": "claim_4ece6d76d97222cd6c782b8abb98408e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_399a6a1ad4caf2bbe46bc11bc69083dc",
    "sourceUnitDigest": "8d685ffb0bc4da547ccbd34385eba75fc934b49dbd81f49245488bb977e93d4b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-221 (lines 2247–2255) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-80. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8d685ffb0bc4da547ccbd34385eba75fc934b49dbd81f49245488bb977e93d4b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
    ]
  }
}
```

### Full source unit

```text
2. **Target cần soul, CÙNG provider với rootTask đang chạy** → ưu tiên
   cơ chế NATIVE của chính provider đó (Claude: Task/SubAgent/Team; agy:
   `--agent` + cơ chế subagent nội bộ của riêng nó — xác nhận thật qua
   changelog agy: "subagent_info payload for delegated subagents...
   nested subagents (grandchild and deeper)" — agy có khái niệm
   native-subagent-trong-session y hệt Claude, không chỉ mỗi CLI flag
   `--agent`). Đây là **native dispatch** — tên tổng quát hoá của
   "task-dispatch" (`tsk-53h`) ra khỏi phạm vi riêng Claude, cho MỌI
   provider có cơ chế in-process của riêng nó.
```

### Full target unit

```text
2. **Target cần soul, CÙNG provider với rootTask đang chạy** → ưu tiên
   cơ chế NATIVE của chính provider đó (Claude: Task/SubAgent/Team; agy:
   `--agent` + cơ chế subagent nội bộ của riêng nó — xác nhận thật qua
   changelog agy: "subagent_info payload for delegated subagents...
   nested subagents (grandchild and deeper)" — agy có khái niệm
   native-subagent-trong-session y hệt Claude, không chỉ mỗi CLI flag
   `--agent`). Đây là **native dispatch** — tên tổng quát hoá của
   "task-dispatch" (`tsk-53h`) ra khỏi phạm vi riêng Claude, cho MỌI
   provider có cơ chế in-process của riêng nó.
```

### Full diff

```diff
No text difference.
```

## claim_8e13478f818abae09e212614ce693dd5

Source digest: a2c396bbee1aa6b738e28b5e0fc9742547db80cc6e3cee1de81054451d0da90e

Target digest: a2c396bbee1aa6b738e28b5e0fc9742547db80cc6e3cee1de81054451d0da90e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-222",
  "sourceLines": [
    2257,
    2263
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-81",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "nativeTargetClaimId": "claim_c0c94bd1005cfa6f32544e95fcef81aa",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8e13478f818abae09e212614ce693dd5",
    "sourceUnitDigest": "a2c396bbee1aa6b738e28b5e0fc9742547db80cc6e3cee1de81054451d0da90e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-222 (lines 2257–2263) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-81. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a2c396bbee1aa6b738e28b5e0fc9742547db80cc6e3cee1de81054451d0da90e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
    ]
  }
}
```

### Full source unit

```text
**Thu hẹp bởi `0033` (2026-08-16):** quy tắc 2 chỉ còn đúng cho
   capacity **agentType-shaped** (chỉ có `agentType`, không có `command`/
   `invocations` riêng — honoring nó `in-process` CHÍNH LÀ honoring cấu
   hình). Một capacity **cli-spawn-shaped** (có `command`/`invocations`
   riêng, ví dụ `agy`) giờ LUÔN cli/spawn khi đã cấu hình, kể cả khi
   caller cùng provider và có sẵn native mechanism — quyết định người
   dùng trực tiếp, xem `0033` cho lý do đầy đủ.
```

### Full target unit

```text
**Thu hẹp bởi `0033` (2026-08-16):** quy tắc 2 chỉ còn đúng cho
   capacity **agentType-shaped** (chỉ có `agentType`, không có `command`/
   `invocations` riêng — honoring nó `in-process` CHÍNH LÀ honoring cấu
   hình). Một capacity **cli-spawn-shaped** (có `command`/`invocations`
   riêng, ví dụ `agy`) giờ LUÔN cli/spawn khi đã cấu hình, kể cả khi
   caller cùng provider và có sẵn native mechanism — quyết định người
   dùng trực tiếp, xem `0033` cho lý do đầy đủ.
```

### Full diff

```diff
No text difference.
```

## claim_7ef4616208cde18e71e68840794ddc68

Source digest: 06330f9a0883e7a751357ac3dc8a5660dba57a31bc3722d8cec7fb5493aebc3e

Target digest: 06330f9a0883e7a751357ac3dc8a5660dba57a31bc3722d8cec7fb5493aebc3e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-223",
  "sourceLines": [
    2265,
    2270
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-82",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "nativeTargetClaimId": "claim_3b1c57f1b17b54c58eabcea679410dcc",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_7ef4616208cde18e71e68840794ddc68",
    "sourceUnitDigest": "06330f9a0883e7a751357ac3dc8a5660dba57a31bc3722d8cec7fb5493aebc3e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-223 (lines 2265–2270) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-82. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "06330f9a0883e7a751357ac3dc8a5660dba57a31bc3722d8cec7fb5493aebc3e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
    ]
  }
}
```

### Full source unit

```text
3. **Target cần soul, KHÁC provider với rootTask đang chạy** → bắt buộc
   cli/spawn (**cli/spawn dispatch** — tên giữ nguyên nghĩa "cli-dispatch"
   cũ). Không có ngoại lệ hôm nay — chưa provider nào hỗ trợ native
   cross-provider (Claude's Task tool chỉ chọn được model Claude, không
   gọi được binary khác — đã xác nhận qua `--model`/`--agent` help text
   lẫn `tsk-53h`'s locked fact).
```

### Full target unit

```text
3. **Target cần soul, KHÁC provider với rootTask đang chạy** → bắt buộc
   cli/spawn (**cli/spawn dispatch** — tên giữ nguyên nghĩa "cli-dispatch"
   cũ). Không có ngoại lệ hôm nay — chưa provider nào hỗ trợ native
   cross-provider (Claude's Task tool chỉ chọn được model Claude, không
   gọi được binary khác — đã xác nhận qua `--model`/`--agent` help text
   lẫn `tsk-53h`'s locked fact).
```

### Full diff

```diff
No text difference.
```

## claim_42c30fd183662e4169a2a222ae977402

Source digest: b5f74856ca0dcc6dc47bcec410ba0630d2f5d25ad449c20ba291262f02079c6a

Target digest: b5f74856ca0dcc6dc47bcec410ba0630d2f5d25ad449c20ba291262f02079c6a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-224",
  "sourceLines": [
    2272,
    2277
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-83",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
  ],
  "nativeTargetClaimId": "claim_62d912df6fec0509e62d13b5e1a52aac",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_42c30fd183662e4169a2a222ae977402",
    "sourceUnitDigest": "b5f74856ca0dcc6dc47bcec410ba0630d2f5d25ad449c20ba291262f02079c6a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-224 (lines 2272–2277) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-83. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b5f74856ca0dcc6dc47bcec410ba0630d2f5d25ad449c20ba291262f02079c6a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)"
    ]
  }
}
```

### Full source unit

```text
4. **Ngoại lệ hợp lệ, không phải bug:** config có thể ép 1 target cùng
   provider vẫn phải cli/spawn, cho mục đích riêng (ví dụ: cách ly tài
   nguyên, cần chạy trong worktree/cwd khác, cần 1 tiến trình độc lập
   hoàn toàn không chia sẻ context). `tsk-3sw`'s `agentType` field
   (headless-runner spawn `claude --agent <name>`) CHÍNH LÀ case này —
   hợp lệ, không sai, không bị tầm nhìn này phủ nhận.
```

### Full target unit

```text
4. **Ngoại lệ hợp lệ, không phải bug:** config có thể ép 1 target cùng
   provider vẫn phải cli/spawn, cho mục đích riêng (ví dụ: cách ly tài
   nguyên, cần chạy trong worktree/cwd khác, cần 1 tiến trình độc lập
   hoàn toàn không chia sẻ context). `tsk-3sw`'s `agentType` field
   (headless-runner spawn `claude --agent <name>`) CHÍNH LÀ case này —
   hợp lệ, không sai, không bị tầm nhìn này phủ nhận.
```

### Full diff

```diff
No text difference.
```

## claim_e0885603b38fb62d780a5ab48de1269e

Source digest: 9b2c1c5aa2f0cbe0a71c20381d107b564322d4b545b758aafe493376a8c25ddf

Target digest: 9b2c1c5aa2f0cbe0a71c20381d107b564322d4b545b758aafe493376a8c25ddf

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "sourceLines": [
    2279,
    2279
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_0539f8138076cd6c9fd7dea618739a26",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e0885603b38fb62d780a5ab48de1269e",
    "sourceUnitDigest": "9b2c1c5aa2f0cbe0a71c20381d107b564322d4b545b758aafe493376a8c25ddf",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni (lines 2279–2279) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9b2c1c5aa2f0cbe0a71c20381d107b564322d4b545b758aafe493376a8c25ddf",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)

Hiện nay 4 trong 5 pha triển khai doctrine (`tsk-1ni`, `tsk-27y`, `tsk-53h`, `tsk-3ik`) đã HOÀN THÀNH, và Pha 5 (`tsk-6db`, mở rộng native detection sang `agy`) được hoãn lại có chủ đích (deferred/YAGNI, chưa có consumer thật) — không phải gap chưa được giải quyết.

Bối cảnh lịch sử và bằng chứng ban đầu (`tsk-1ni`): `judgeDiscovery`/`judgeDecompose` — 1 capacity cần soul (helper functional, không phải subTask) — trước đây LUÔN cli/spawn 1 `claude -p` con, dù caller (chính session đang gọi `fgos discover`) đã là 1 soul sống, CÙNG provider, đã có sẵn context tốt hơn (đã đọc CONTEXT.md, đã tự Socratic xong). Đúng lẽ ra phải rơi vào nhánh 2 (native — tự suy luận tiếp, không cần spawn gì cả) nhưng lại rơi vào nhánh 3/4 một cách âm thầm, sai — không phải vì thiếu khái niệm kiến trúc, mà vì thiếu cơ chế PHÁT HIỆN "tôi đang được gọi từ 1 soul sống cùng provider hay không" trước khi quyết định.

Tầm nhìn ban đầu cho rằng lớp thiếu này cần LÀ MỘT PHÁN ĐOÁN CỦA LLM (không thuần cơ học) vì tín hiệu quyết định không chỉ là 1 biến môi trường boolean (`CLAUDECODE` có mặt hay không) — còn phải cân nhắc: capacity này có thật sự cần soul không, có tồn tại cơ chế native tương ứng không, config có ép cli/spawn không, và (khi native khả dụng) có đáng dùng native hay vẫn nên cli/spawn vì lý do cô lập/tài nguyên.

**Bản thu hẹp có chủ đích trong thực tế:** Những gì đã được ship (`tsk-53h` / `tsk-3ik`) là một bản thu hẹp có chủ đích (deliberate narrowing) của tầm nhìn 4 yếu tố phán đoán LLM ban đầu: 3 yếu tố được giải quyết cơ học ở thời điểm cấu hình (config-time: shape/kind agent vs tool, config ép cli-spawn), và yếu tố runtime duy nhất còn lại ("liệu tôi có đang là 1 soul sống có quyền truy cập Task tool hay không") được thu gọn thành cờ tự khai báo `--has-live-task-access` do caller truyền trực tiếp (không bao giờ tự dò tìm hay đoán mò). Bằng chứng mã nguồn: `src/runner/dispatch/mechanism.mjs:42` (`decideDispatchMechanism`) và `src/runner/dispatch/mechanism.mjs:82` (`decideExecutorDispatchMechanism`).
```

### Full target unit

```text
#### Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)

Hiện nay 4 trong 5 pha triển khai doctrine (`tsk-1ni`, `tsk-27y`, `tsk-53h`, `tsk-3ik`) đã HOÀN THÀNH, và Pha 5 (`tsk-6db`, mở rộng native detection sang `agy`) được hoãn lại có chủ đích (deferred/YAGNI, chưa có consumer thật) — không phải gap chưa được giải quyết.

Bối cảnh lịch sử và bằng chứng ban đầu (`tsk-1ni`): `judgeDiscovery`/`judgeDecompose` — 1 capacity cần soul (helper functional, không phải subTask) — trước đây LUÔN cli/spawn 1 `claude -p` con, dù caller (chính session đang gọi `fgos discover`) đã là 1 soul sống, CÙNG provider, đã có sẵn context tốt hơn (đã đọc CONTEXT.md, đã tự Socratic xong). Đúng lẽ ra phải rơi vào nhánh 2 (native — tự suy luận tiếp, không cần spawn gì cả) nhưng lại rơi vào nhánh 3/4 một cách âm thầm, sai — không phải vì thiếu khái niệm kiến trúc, mà vì thiếu cơ chế PHÁT HIỆN "tôi đang được gọi từ 1 soul sống cùng provider hay không" trước khi quyết định.

Tầm nhìn ban đầu cho rằng lớp thiếu này cần LÀ MỘT PHÁN ĐOÁN CỦA LLM (không thuần cơ học) vì tín hiệu quyết định không chỉ là 1 biến môi trường boolean (`CLAUDECODE` có mặt hay không) — còn phải cân nhắc: capacity này có thật sự cần soul không, có tồn tại cơ chế native tương ứng không, config có ép cli/spawn không, và (khi native khả dụng) có đáng dùng native hay vẫn nên cli/spawn vì lý do cô lập/tài nguyên.

**Bản thu hẹp có chủ đích trong thực tế:** Những gì đã được ship (`tsk-53h` / `tsk-3ik`) là một bản thu hẹp có chủ đích (deliberate narrowing) của tầm nhìn 4 yếu tố phán đoán LLM ban đầu: 3 yếu tố được giải quyết cơ học ở thời điểm cấu hình (config-time: shape/kind agent vs tool, config ép cli-spawn), và yếu tố runtime duy nhất còn lại ("liệu tôi có đang là 1 soul sống có quyền truy cập Task tool hay không") được thu gọn thành cờ tự khai báo `--has-live-task-access` do caller truyền trực tiếp (không bao giờ tự dò tìm hay đoán mò). Bằng chứng mã nguồn: `src/runner/dispatch/mechanism.mjs:42` (`decideDispatchMechanism`) và `src/runner/dispatch/mechanism.mjs:82` (`decideExecutorDispatchMechanism`).
```

### Full diff

```diff
No text difference.
```

## claim_8d91631a900ec4103a5c2b0d5b989fc2

Source digest: 8e9ea115c9a30150034656ef2beddb41cfb29d33bb95e880aa8d8208670531f8

Target digest: 8e9ea115c9a30150034656ef2beddb41cfb29d33bb95e880aa8d8208670531f8

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-225",
  "sourceLines": [
    2281,
    2281
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-84",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "nativeTargetClaimId": "claim_d003c48eed54b7740464269c335d6c81",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8d91631a900ec4103a5c2b0d5b989fc2",
    "sourceUnitDigest": "8e9ea115c9a30150034656ef2beddb41cfb29d33bb95e880aa8d8208670531f8",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-225 (lines 2281–2281) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-84. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8e9ea115c9a30150034656ef2beddb41cfb29d33bb95e880aa8d8208670531f8",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
    ]
  }
}
```

### Full source unit

```text
Hiện nay 4 trong 5 pha triển khai doctrine (`tsk-1ni`, `tsk-27y`, `tsk-53h`, `tsk-3ik`) đã HOÀN THÀNH, và Pha 5 (`tsk-6db`, mở rộng native detection sang `agy`) được hoãn lại có chủ đích (deferred/YAGNI, chưa có consumer thật) — không phải gap chưa được giải quyết.
```

### Full target unit

```text
Hiện nay 4 trong 5 pha triển khai doctrine (`tsk-1ni`, `tsk-27y`, `tsk-53h`, `tsk-3ik`) đã HOÀN THÀNH, và Pha 5 (`tsk-6db`, mở rộng native detection sang `agy`) được hoãn lại có chủ đích (deferred/YAGNI, chưa có consumer thật) — không phải gap chưa được giải quyết.
```

### Full diff

```diff
No text difference.
```

## claim_4698df498321c7999068e58b926bc2de

Source digest: f3cc0934dea71c1ede313ad7075547981150a427730809d22741b3fc261b85c9

Target digest: f3cc0934dea71c1ede313ad7075547981150a427730809d22741b3fc261b85c9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-226",
  "sourceLines": [
    2283,
    2283
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-85",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "nativeTargetClaimId": "claim_e03db161b8c68307c1a30d2bc29b9a16",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4698df498321c7999068e58b926bc2de",
    "sourceUnitDigest": "f3cc0934dea71c1ede313ad7075547981150a427730809d22741b3fc261b85c9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-226 (lines 2283–2283) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-85. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f3cc0934dea71c1ede313ad7075547981150a427730809d22741b3fc261b85c9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
    ]
  }
}
```

### Full source unit

```text
Bối cảnh lịch sử và bằng chứng ban đầu (`tsk-1ni`): `judgeDiscovery`/`judgeDecompose` — 1 capacity cần soul (helper functional, không phải subTask) — trước đây LUÔN cli/spawn 1 `claude -p` con, dù caller (chính session đang gọi `fgos discover`) đã là 1 soul sống, CÙNG provider, đã có sẵn context tốt hơn (đã đọc CONTEXT.md, đã tự Socratic xong). Đúng lẽ ra phải rơi vào nhánh 2 (native — tự suy luận tiếp, không cần spawn gì cả) nhưng lại rơi vào nhánh 3/4 một cách âm thầm, sai — không phải vì thiếu khái niệm kiến trúc, mà vì thiếu cơ chế PHÁT HIỆN "tôi đang được gọi từ 1 soul sống cùng provider hay không" trước khi quyết định.
```

### Full target unit

```text
Bối cảnh lịch sử và bằng chứng ban đầu (`tsk-1ni`): `judgeDiscovery`/`judgeDecompose` — 1 capacity cần soul (helper functional, không phải subTask) — trước đây LUÔN cli/spawn 1 `claude -p` con, dù caller (chính session đang gọi `fgos discover`) đã là 1 soul sống, CÙNG provider, đã có sẵn context tốt hơn (đã đọc CONTEXT.md, đã tự Socratic xong). Đúng lẽ ra phải rơi vào nhánh 2 (native — tự suy luận tiếp, không cần spawn gì cả) nhưng lại rơi vào nhánh 3/4 một cách âm thầm, sai — không phải vì thiếu khái niệm kiến trúc, mà vì thiếu cơ chế PHÁT HIỆN "tôi đang được gọi từ 1 soul sống cùng provider hay không" trước khi quyết định.
```

### Full diff

```diff
No text difference.
```

## claim_61d64e215a358590a29fd961d4859d04

Source digest: 9c7f0523627ad2f140830526a968421c4dcc833955a40189e0bd6f559095a9c6

Target digest: 9c7f0523627ad2f140830526a968421c4dcc833955a40189e0bd6f559095a9c6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-227",
  "sourceLines": [
    2285,
    2285
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-86",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "nativeTargetClaimId": "claim_202df4ecb13d711fa5662fa37bfd7cb6",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_61d64e215a358590a29fd961d4859d04",
    "sourceUnitDigest": "9c7f0523627ad2f140830526a968421c4dcc833955a40189e0bd6f559095a9c6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-227 (lines 2285–2285) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-86. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9c7f0523627ad2f140830526a968421c4dcc833955a40189e0bd6f559095a9c6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
    ]
  }
}
```

### Full source unit

```text
Tầm nhìn ban đầu cho rằng lớp thiếu này cần LÀ MỘT PHÁN ĐOÁN CỦA LLM (không thuần cơ học) vì tín hiệu quyết định không chỉ là 1 biến môi trường boolean (`CLAUDECODE` có mặt hay không) — còn phải cân nhắc: capacity này có thật sự cần soul không, có tồn tại cơ chế native tương ứng không, config có ép cli/spawn không, và (khi native khả dụng) có đáng dùng native hay vẫn nên cli/spawn vì lý do cô lập/tài nguyên.
```

### Full target unit

```text
Tầm nhìn ban đầu cho rằng lớp thiếu này cần LÀ MỘT PHÁN ĐOÁN CỦA LLM (không thuần cơ học) vì tín hiệu quyết định không chỉ là 1 biến môi trường boolean (`CLAUDECODE` có mặt hay không) — còn phải cân nhắc: capacity này có thật sự cần soul không, có tồn tại cơ chế native tương ứng không, config có ép cli/spawn không, và (khi native khả dụng) có đáng dùng native hay vẫn nên cli/spawn vì lý do cô lập/tài nguyên.
```

### Full diff

```diff
No text difference.
```

## claim_9e03e34162628933345e9e0a920f11a0

Source digest: c1d41076fc9c0ad883f0d1d20d3da175014eed7ae60eef90029fd144023bdf14

Target digest: c1d41076fc9c0ad883f0d1d20d3da175014eed7ae60eef90029fd144023bdf14

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-228",
  "sourceLines": [
    2287,
    2287
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-87",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
  ],
  "nativeTargetClaimId": "claim_da178d8a43b011bb21740631d2e5ab2e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lớp-còn-thiếu-llm-đủ-thông-minh-để-tự-nhận-ra-khi-nào-dùng-nhánh-nào-đã-hoàn-thành-45-pha-pha-5-hoãnyagni",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9e03e34162628933345e9e0a920f11a0",
    "sourceUnitDigest": "c1d41076fc9c0ad883f0d1d20d3da175014eed7ae60eef90029fd144023bdf14",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-228 (lines 2287–2287) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-87. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c1d41076fc9c0ad883f0d1d20d3da175014eed7ae60eef90029fd144023bdf14",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)"
    ]
  }
}
```

### Full source unit

```text
**Bản thu hẹp có chủ đích trong thực tế:** Những gì đã được ship (`tsk-53h` / `tsk-3ik`) là một bản thu hẹp có chủ đích (deliberate narrowing) của tầm nhìn 4 yếu tố phán đoán LLM ban đầu: 3 yếu tố được giải quyết cơ học ở thời điểm cấu hình (config-time: shape/kind agent vs tool, config ép cli-spawn), và yếu tố runtime duy nhất còn lại ("liệu tôi có đang là 1 soul sống có quyền truy cập Task tool hay không") được thu gọn thành cờ tự khai báo `--has-live-task-access` do caller truyền trực tiếp (không bao giờ tự dò tìm hay đoán mò). Bằng chứng mã nguồn: `src/runner/dispatch/mechanism.mjs:42` (`decideDispatchMechanism`) và `src/runner/dispatch/mechanism.mjs:82` (`decideExecutorDispatchMechanism`).
```

### Full target unit

```text
**Bản thu hẹp có chủ đích trong thực tế:** Những gì đã được ship (`tsk-53h` / `tsk-3ik`) là một bản thu hẹp có chủ đích (deliberate narrowing) của tầm nhìn 4 yếu tố phán đoán LLM ban đầu: 3 yếu tố được giải quyết cơ học ở thời điểm cấu hình (config-time: shape/kind agent vs tool, config ép cli-spawn), và yếu tố runtime duy nhất còn lại ("liệu tôi có đang là 1 soul sống có quyền truy cập Task tool hay không") được thu gọn thành cờ tự khai báo `--has-live-task-access` do caller truyền trực tiếp (không bao giờ tự dò tìm hay đoán mò). Bằng chứng mã nguồn: `src/runner/dispatch/mechanism.mjs:42` (`decideDispatchMechanism`) và `src/runner/dispatch/mechanism.mjs:82` (`decideExecutorDispatchMechanism`).
```

### Full diff

```diff
No text difference.
```

## claim_da73abd735dca12fcb4d508d11f9f975

Source digest: 5d0d207831679ad73d093b302ed61abea90fecf30e2e55a713a66456b0bd6437

Target digest: 5d0d207831679ad73d093b302ed61abea90fecf30e2e55a713a66456b0bd6437

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn",
  "sourceLines": [
    2289,
    2289
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_6efd256ef37faa5b80967a0896c78b43",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_da73abd735dca12fcb4d508d11f9f975",
    "sourceUnitDigest": "5d0d207831679ad73d093b302ed61abea90fecf30e2e55a713a66456b0bd6437",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn (lines 2289–2289) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5d0d207831679ad73d093b302ed61abea90fecf30e2e55a713a66456b0bd6437",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn

- `tsk-3sw` (agentType, Claude-only, build qua cli/spawn) — là 1 mảnh
  ghép ĐÚNG của quy tắc 4 (ngoại lệ hợp lệ) + phần thật cần cho mọi
  nhánh khác cũng vậy (cli/spawn primitive vẫn cần tồn tại, dùng chung
  cho case cơ học/cross-provider/config-ép). Không bị supersede.
- `tsk-53h`'s nesting rule + bằng chứng đa-provider (Claude/agy/Codex 3
  shape khác nhau) — ĐÚNG NỀN TẢNG quy tắc 2/3 ở trên dựa vào, không đổi.
- Cả 2 item đó và gap `tsk-1ni` đều chỉ là MẢNH GHÉP hẹp (cơ chế
  `capabilities.<id>` config riêng của fgOS) của bức tranh rộng hơn tầm
  nhìn này vẽ ra (gộp cả việc tự gọi Task tool ngoài cơ chế
  `capabilities.<id>`, gộp cả khái niệm launcher tường minh).
```

### Full target unit

```text
#### Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn

- `tsk-3sw` (agentType, Claude-only, build qua cli/spawn) — là 1 mảnh
  ghép ĐÚNG của quy tắc 4 (ngoại lệ hợp lệ) + phần thật cần cho mọi
  nhánh khác cũng vậy (cli/spawn primitive vẫn cần tồn tại, dùng chung
  cho case cơ học/cross-provider/config-ép). Không bị supersede.
- `tsk-53h`'s nesting rule + bằng chứng đa-provider (Claude/agy/Codex 3
  shape khác nhau) — ĐÚNG NỀN TẢNG quy tắc 2/3 ở trên dựa vào, không đổi.
- Cả 2 item đó và gap `tsk-1ni` đều chỉ là MẢNH GHÉP hẹp (cơ chế
  `capabilities.<id>` config riêng của fgOS) của bức tranh rộng hơn tầm
  nhìn này vẽ ra (gộp cả việc tự gọi Task tool ngoài cơ chế
  `capabilities.<id>`, gộp cả khái niệm launcher tường minh).
```

### Full diff

```diff
No text difference.
```

## claim_29551bf7cdd778fb08c7cd0565514abf

Source digest: 3260eba790539fb75d1267b6e6be768e478631b2ba61acc0b0bfc801cd888009

Target digest: 3260eba790539fb75d1267b6e6be768e478631b2ba61acc0b0bfc801cd888009

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-229",
  "sourceLines": [
    2291,
    2300
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-88",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn"
  ],
  "nativeTargetClaimId": "claim_25a0654915756c7beddd323435fb006b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quan-hệ-với-việc-đã-khoá-không-mâu-thuẫn-chỉ-hẹp-hơn",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_29551bf7cdd778fb08c7cd0565514abf",
    "sourceUnitDigest": "3260eba790539fb75d1267b6e6be768e478631b2ba61acc0b0bfc801cd888009",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-229 (lines 2291–2300) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-88. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3260eba790539fb75d1267b6e6be768e478631b2ba61acc0b0bfc801cd888009",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn"
    ]
  }
}
```

### Full source unit

```text
- `tsk-3sw` (agentType, Claude-only, build qua cli/spawn) — là 1 mảnh
  ghép ĐÚNG của quy tắc 4 (ngoại lệ hợp lệ) + phần thật cần cho mọi
  nhánh khác cũng vậy (cli/spawn primitive vẫn cần tồn tại, dùng chung
  cho case cơ học/cross-provider/config-ép). Không bị supersede.
- `tsk-53h`'s nesting rule + bằng chứng đa-provider (Claude/agy/Codex 3
  shape khác nhau) — ĐÚNG NỀN TẢNG quy tắc 2/3 ở trên dựa vào, không đổi.
- Cả 2 item đó và gap `tsk-1ni` đều chỉ là MẢNH GHÉP hẹp (cơ chế
  `capabilities.<id>` config riêng của fgOS) của bức tranh rộng hơn tầm
  nhìn này vẽ ra (gộp cả việc tự gọi Task tool ngoài cơ chế
  `capabilities.<id>`, gộp cả khái niệm launcher tường minh).
```

### Full target unit

```text
- `tsk-3sw` (agentType, Claude-only, build qua cli/spawn) — là 1 mảnh
  ghép ĐÚNG của quy tắc 4 (ngoại lệ hợp lệ) + phần thật cần cho mọi
  nhánh khác cũng vậy (cli/spawn primitive vẫn cần tồn tại, dùng chung
  cho case cơ học/cross-provider/config-ép). Không bị supersede.
- `tsk-53h`'s nesting rule + bằng chứng đa-provider (Claude/agy/Codex 3
  shape khác nhau) — ĐÚNG NỀN TẢNG quy tắc 2/3 ở trên dựa vào, không đổi.
- Cả 2 item đó và gap `tsk-1ni` đều chỉ là MẢNH GHÉP hẹp (cơ chế
  `capabilities.<id>` config riêng của fgOS) của bức tranh rộng hơn tầm
  nhìn này vẽ ra (gộp cả việc tự gọi Task tool ngoài cơ chế
  `capabilities.<id>`, gộp cả khái niệm launcher tường minh).
```

### Full diff

```diff
No text difference.
```

## claim_4434041dbcdebe16d090670b036ca41f

Source digest: a51871f12e9a056d232f85809eae3593b63633b95dc564ad11cf4e63ff4dc290

Target digest: a51871f12e9a056d232f85809eae3593b63633b95dc564ad11cf4e63ff4dc290

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận",
  "sourceLines": [
    2302,
    2302
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_109aed8e2a6eb4c654c8fe14364c0a1d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4434041dbcdebe16d090670b036ca41f",
    "sourceUnitDigest": "a51871f12e9a056d232f85809eae3593b63633b95dc564ad11cf4e63ff4dc290",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận (lines 2302–2302) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a51871f12e9a056d232f85809eae3593b63633b95dc564ad11cf4e63ff4dc290",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Ranh giới quan sát được (observability) — tránh ngộ nhận

Ưu tiên native (quy tắc 2) có 2 lý do ĐỘC LẬP, không phải 1: (a) tránh
lãng phí/sai lệch khi soul mù re-derive 1 phán đoán soul sống đã làm rồi
(đúng bug `tsk-1ni`) — lý do này ĐÚNG ở CẢ launcher tương tác lẫn
headless; (b) quan sát được trực tiếp (agent-terminal tương tác cho thấy
pane/subagent sống) — lý do này CHỈ đúng khi launcher đang tương tác.
Khi rootTask tự nó chạy headless (spawn bởi `fgos-runner`), dùng native
bên trong nó (nested Task) VẪN tránh được lãng phí (a) nhưng KHÔNG cho
quan sát sống (b) — vẫn chỉ ghi lại post-hoc, có điều kiện, qua
scout-notes.md (đã trace thật trong buổi thảo luận này). Không đánh đồng
"dùng native" với "quan sát được" — 2 lợi ích tách biệt, chỉ trùng nhau
khi launcher vốn đã tương tác.
```

### Full target unit

```text
#### Ranh giới quan sát được (observability) — tránh ngộ nhận

Ưu tiên native (quy tắc 2) có 2 lý do ĐỘC LẬP, không phải 1: (a) tránh
lãng phí/sai lệch khi soul mù re-derive 1 phán đoán soul sống đã làm rồi
(đúng bug `tsk-1ni`) — lý do này ĐÚNG ở CẢ launcher tương tác lẫn
headless; (b) quan sát được trực tiếp (agent-terminal tương tác cho thấy
pane/subagent sống) — lý do này CHỈ đúng khi launcher đang tương tác.
Khi rootTask tự nó chạy headless (spawn bởi `fgos-runner`), dùng native
bên trong nó (nested Task) VẪN tránh được lãng phí (a) nhưng KHÔNG cho
quan sát sống (b) — vẫn chỉ ghi lại post-hoc, có điều kiện, qua
scout-notes.md (đã trace thật trong buổi thảo luận này). Không đánh đồng
"dùng native" với "quan sát được" — 2 lợi ích tách biệt, chỉ trùng nhau
khi launcher vốn đã tương tác.
```

### Full diff

```diff
No text difference.
```

## claim_4e7c489e21608b903806cd5da65a1697

Source digest: 542a202779574baac3b57e31b9804ef6af61d06ae307ba372769f30f46ff0b51

Target digest: 542a202779574baac3b57e31b9804ef6af61d06ae307ba372769f30f46ff0b51

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-230",
  "sourceLines": [
    2304,
    2314
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Ranh giới quan sát được (observability) — tránh ngộ nhận"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-89",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Ranh giới quan sát được (observability) — tránh ngộ nhận"
  ],
  "nativeTargetClaimId": "claim_6b11070082a96b7c7b019efbaef8954f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "ranh-giới-quan-sát-được-observability-tránh-ngộ-nhận",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4e7c489e21608b903806cd5da65a1697",
    "sourceUnitDigest": "542a202779574baac3b57e31b9804ef6af61d06ae307ba372769f30f46ff0b51",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-230 (lines 2304–2314) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-89. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "542a202779574baac3b57e31b9804ef6af61d06ae307ba372769f30f46ff0b51",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Ranh giới quan sát được (observability) — tránh ngộ nhận"
    ]
  }
}
```

### Full source unit

```text
Ưu tiên native (quy tắc 2) có 2 lý do ĐỘC LẬP, không phải 1: (a) tránh
lãng phí/sai lệch khi soul mù re-derive 1 phán đoán soul sống đã làm rồi
(đúng bug `tsk-1ni`) — lý do này ĐÚNG ở CẢ launcher tương tác lẫn
headless; (b) quan sát được trực tiếp (agent-terminal tương tác cho thấy
pane/subagent sống) — lý do này CHỈ đúng khi launcher đang tương tác.
Khi rootTask tự nó chạy headless (spawn bởi `fgos-runner`), dùng native
bên trong nó (nested Task) VẪN tránh được lãng phí (a) nhưng KHÔNG cho
quan sát sống (b) — vẫn chỉ ghi lại post-hoc, có điều kiện, qua
scout-notes.md (đã trace thật trong buổi thảo luận này). Không đánh đồng
"dùng native" với "quan sát được" — 2 lợi ích tách biệt, chỉ trùng nhau
khi launcher vốn đã tương tác.
```

### Full target unit

```text
Ưu tiên native (quy tắc 2) có 2 lý do ĐỘC LẬP, không phải 1: (a) tránh
lãng phí/sai lệch khi soul mù re-derive 1 phán đoán soul sống đã làm rồi
(đúng bug `tsk-1ni`) — lý do này ĐÚNG ở CẢ launcher tương tác lẫn
headless; (b) quan sát được trực tiếp (agent-terminal tương tác cho thấy
pane/subagent sống) — lý do này CHỈ đúng khi launcher đang tương tác.
Khi rootTask tự nó chạy headless (spawn bởi `fgos-runner`), dùng native
bên trong nó (nested Task) VẪN tránh được lãng phí (a) nhưng KHÔNG cho
quan sát sống (b) — vẫn chỉ ghi lại post-hoc, có điều kiện, qua
scout-notes.md (đã trace thật trong buổi thảo luận này). Không đánh đồng
"dùng native" với "quan sát được" — 2 lợi ích tách biệt, chỉ trùng nhau
khi launcher vốn đã tương tác.
```

### Full diff

```diff
No text difference.
```
