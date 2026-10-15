# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **5**. Target: `docs/platform/runner/decisions/h-aabefc85f0c9.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `79a83175068ef057429b307c8cac651fc51bf7f8a58c301e5c55ee2d362a9cec`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **5/5** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_39d792588a8be9f5c525406f7692f77c",
      "claim_edb87e31d0f69ae2f7df349f4cb9ee45",
      "claim_ba3f27a8e3fd4763efcfdbd1858b5789",
      "claim_49b0591431ed2d1e033a6b960a760e1f",
      "claim_f572736a09f2e9266fa2f6b26ffb72ea"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_39d792588a8be9f5c525406f7692f77c

Source digest: e3b9637386370205add50577674190f948eb94fefd4b56a1ffa35cff7f701478

Target digest: e3b9637386370205add50577674190f948eb94fefd4b56a1ffa35cff7f701478

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "sourceLines": [
    1362,
    1362
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
  "targetAnchor": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "targetAncestry": [
    "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "nativeTargetClaimId": "claim_3abf96a1803f0bce6ad231974a83d034",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_39d792588a8be9f5c525406f7692f77c",
    "sourceUnitDigest": "e3b9637386370205add50577674190f948eb94fefd4b56a1ffa35cff7f701478",
    "targetOwner": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
    "targetAnchor": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner (lines 1362–1362) carried at docs/platform/runner/decisions/h-aabefc85f0c9.md#coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e3b9637386370205add50577674190f948eb94fefd4b56a1ffa35cff7f701478",
    "targetAncestry": [
      "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
    ]
  }
}
```

### Full source unit

```text
## CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)

> **Ghi chú chuyển tiếp (2026-10-02):** Engine coordination và khái niệm `CoordinationSession`/`CoordinationProtocol`/`FlowDefinition` đã được thu hồi ở P4. Mọi lần chạy độc lập quy về **Unit run** qua Pattern cộng tác (`CollaborationPattern`: `solo`, `reviewed`, `panel` + preset) hoặc **Workflow run** (`src/workflow/**`). Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08.

Đây là mô tả tầm SPEC (BA-grade, WHAT chứ không phải code) của ranh giới
`CoordinationSession` đã được chốt ở Phase 00 của track `step-08-standalone-
coordination` — canonical đầy đủ (schema, ADR, ví dụ) sống ở
`docs/architect/agent-coordination/`; mục này chỉ tóm lược đủ để một phiên
session engine + quorum/retry/cancellation + hard-budget/security hardening
đều đã có thật tại `src/runner/coordination/{schema,store,replay,
session-engine}.mjs` (test: `test/runner/coordination-*.test.mjs`) —
store/schema/events/direct cutover từ `mission-lite.mjs` cũ (đã xoá). Phase
06 R5-R7 (cell P06.2): `aggregateBounds` enforcement nay ĐỒNG NHẤT trên mọi
đường dispatch (trước đó, đường agent-led `dispatchPrimaryTask`/
`proposeConsult` không forward 3 cap concurrency-sensitive nào và không
chạy check wall-time/task-depth — tìm thấy và vá thật, không phải giả định);
`coordinationId` nay bị chặn ký tự an toàn (alnum/underscore/hyphen), đóng
một lỗ path-traversal thật (một `coordinationId` chứa `../` từng tạo được
thư mục THẬT ngoài `.fgos/coordination/sessions/`); `linkResult` nay từ
chối một `runId` không đúng quy ước của chính `assignmentId` nó gắn vào,
ngay tại thời điểm ghi (đóng một lỗ foreign-evidence thật, dù lỗ đó chưa
từng dẫn tới false-success vì đọc lại luôn fail-closed). Phase 06 R8 (đóng
độc lập bởi Reviewer+Red-Team cho toàn ma trận recovery/budget R1-R7) là
bước tiếp theo của Coordinator sau cell P06.2, chưa phải việc của Doer.

**CoordinationSession là gì.** Một lần điều phối agent có biên (bounded) —
objective, actor, budget, task/Assignment runtime khi cần, kết quả tổng hợp —
có thể chạy ĐỘC LẬP với Work (`workId: null`, không Stage, không TaskSpec,
không protocol) hoặc tham chiếu Work chỉ như context đọc-thôi. Nó là ROOT
thực thi/phục hồi của V1 — nghĩa là một phiên bị crash/resume tra cứu tiến độ
qua đúng bản ghi này, không qua đâu khác. CoordinationSession sở hữu tiến độ
điều phối, KHÔNG BAO GIỜ sở hữu vòng đời Work (bất biến cũ vẫn giữ nguyên,
xem `docs/architect/agent-coordination/architecture/work-integration.md`).
Chi tiết schema: `docs/architect/agent-coordination/contracts/coordination-session.md`;
quyết định nền: `docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md`.

**Recheck-discharge quorum fix (2026-09-18).** `closeSessionByQuorum`'s
multi-operation-per-actor path (P10-KERNEL-FIX) trước đây chấm một gating
operation bắt buộc (`review-candidate`/`red-team-candidate`) là `failed`
VĨNH VIỄN một khi verdict là `findings` — dù fix-round sau đó
(`reviewer-recheck`/`red-team-recheck`) đã pass sạch, vì hai operation id
khác nhau nên `resolveBindingOutcome` không bao giờ liên hệ được. `close.json`
vì vậy refuse mãi với `missing required actor(s)` cho MỌI cell từng có dù
chỉ 1 finding ở first-pass — phát hiện thật khi chạy `fgos-code-panel` lần
đầu tới bước close (`code-panel--r3-p1-remote-projector-presenter`). Sửa:
Pattern cộng tác binding thêm field `rechecks: <operationId>` (`definitions/
schema.mjs`, khai trên `reviewer-recheck`/`red-team-recheck` trong
`standalone-master-coordination-loop.yaml`); `session-engine.mjs`'s
`resolveRecheckDischarge` cho một recheck ĐÃ declare, cùng actor, dispatch
SAU `result-linked` của attempt failed, VÀ đã có `driver-disposition-recorded`
nhắm đúng assignment failed đó, mới được discharge slot — không suy luận
theo role/graph-adjacency/naming, không parse nội dung disposition. Test:
`test/runner/coordination-recheck-discharge.test.mjs`.
```

### Full target unit

```text
## CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)

> **Ghi chú chuyển tiếp (2026-10-02):** Engine coordination và khái niệm `CoordinationSession`/`CoordinationProtocol`/`FlowDefinition` đã được thu hồi ở P4. Mọi lần chạy độc lập quy về **Unit run** qua Pattern cộng tác (`CollaborationPattern`: `solo`, `reviewed`, `panel` + preset) hoặc **Workflow run** (`src/workflow/**`). Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08.

Đây là mô tả tầm SPEC (BA-grade, WHAT chứ không phải code) của ranh giới
`CoordinationSession` đã được chốt ở Phase 00 của track `step-08-standalone-
coordination` — canonical đầy đủ (schema, ADR, ví dụ) sống ở
`docs/architect/agent-coordination/`; mục này chỉ tóm lược đủ để một phiên
session engine + quorum/retry/cancellation + hard-budget/security hardening
đều đã có thật tại `src/runner/coordination/{schema,store,replay,
session-engine}.mjs` (test: `test/runner/coordination-*.test.mjs`) —
store/schema/events/direct cutover từ `mission-lite.mjs` cũ (đã xoá). Phase
06 R5-R7 (cell P06.2): `aggregateBounds` enforcement nay ĐỒNG NHẤT trên mọi
đường dispatch (trước đó, đường agent-led `dispatchPrimaryTask`/
`proposeConsult` không forward 3 cap concurrency-sensitive nào và không
chạy check wall-time/task-depth — tìm thấy và vá thật, không phải giả định);
`coordinationId` nay bị chặn ký tự an toàn (alnum/underscore/hyphen), đóng
một lỗ path-traversal thật (một `coordinationId` chứa `../` từng tạo được
thư mục THẬT ngoài `.fgos/coordination/sessions/`); `linkResult` nay từ
chối một `runId` không đúng quy ước của chính `assignmentId` nó gắn vào,
ngay tại thời điểm ghi (đóng một lỗ foreign-evidence thật, dù lỗ đó chưa
từng dẫn tới false-success vì đọc lại luôn fail-closed). Phase 06 R8 (đóng
độc lập bởi Reviewer+Red-Team cho toàn ma trận recovery/budget R1-R7) là
bước tiếp theo của Coordinator sau cell P06.2, chưa phải việc của Doer.

**CoordinationSession là gì.** Một lần điều phối agent có biên (bounded) —
objective, actor, budget, task/Assignment runtime khi cần, kết quả tổng hợp —
có thể chạy ĐỘC LẬP với Work (`workId: null`, không Stage, không TaskSpec,
không protocol) hoặc tham chiếu Work chỉ như context đọc-thôi. Nó là ROOT
thực thi/phục hồi của V1 — nghĩa là một phiên bị crash/resume tra cứu tiến độ
qua đúng bản ghi này, không qua đâu khác. CoordinationSession sở hữu tiến độ
điều phối, KHÔNG BAO GIỜ sở hữu vòng đời Work (bất biến cũ vẫn giữ nguyên,
xem `docs/architect/agent-coordination/architecture/work-integration.md`).
Chi tiết schema: `docs/architect/agent-coordination/contracts/coordination-session.md`;
quyết định nền: `docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md`.

**Recheck-discharge quorum fix (2026-09-18).** `closeSessionByQuorum`'s
multi-operation-per-actor path (P10-KERNEL-FIX) trước đây chấm một gating
operation bắt buộc (`review-candidate`/`red-team-candidate`) là `failed`
VĨNH VIỄN một khi verdict là `findings` — dù fix-round sau đó
(`reviewer-recheck`/`red-team-recheck`) đã pass sạch, vì hai operation id
khác nhau nên `resolveBindingOutcome` không bao giờ liên hệ được. `close.json`
vì vậy refuse mãi với `missing required actor(s)` cho MỌI cell từng có dù
chỉ 1 finding ở first-pass — phát hiện thật khi chạy `fgos-code-panel` lần
đầu tới bước close (`code-panel--r3-p1-remote-projector-presenter`). Sửa:
Pattern cộng tác binding thêm field `rechecks: <operationId>` (`definitions/
schema.mjs`, khai trên `reviewer-recheck`/`red-team-recheck` trong
`standalone-master-coordination-loop.yaml`); `session-engine.mjs`'s
`resolveRecheckDischarge` cho một recheck ĐÃ declare, cùng actor, dispatch
SAU `result-linked` của attempt failed, VÀ đã có `driver-disposition-recorded`
nhắm đúng assignment failed đó, mới được discharge slot — không suy luận
theo role/graph-adjacency/naming, không parse nội dung disposition. Test:
`test/runner/coordination-recheck-discharge.test.mjs`.
```

### Full diff

```diff
No text difference.
```

## claim_edb87e31d0f69ae2f7df349f4cb9ee45

Source digest: 3e87ab95090ec039048f7985c02181ec1b1b5c6337fcd23410d76a3c76473d1c

Target digest: 3e87ab95090ec039048f7985c02181ec1b1b5c6337fcd23410d76a3c76473d1c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-113",
  "sourceLines": [
    1364,
    1364
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "nativeTargetClaimId": "claim_661dbefedc4d7f41f7419944e86e42c0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_edb87e31d0f69ae2f7df349f4cb9ee45",
    "sourceUnitDigest": "3e87ab95090ec039048f7985c02181ec1b1b5c6337fcd23410d76a3c76473d1c",
    "targetOwner": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-113 (lines 1364–1364) carried at docs/platform/runner/decisions/h-aabefc85f0c9.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3e87ab95090ec039048f7985c02181ec1b1b5c6337fcd23410d76a3c76473d1c",
    "targetAncestry": [
      "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
      "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
    ]
  }
}
```

### Full source unit

```text
> **Ghi chú chuyển tiếp (2026-10-02):** Engine coordination và khái niệm `CoordinationSession`/`CoordinationProtocol`/`FlowDefinition` đã được thu hồi ở P4. Mọi lần chạy độc lập quy về **Unit run** qua Pattern cộng tác (`CollaborationPattern`: `solo`, `reviewed`, `panel` + preset) hoặc **Workflow run** (`src/workflow/**`). Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08.
```

### Full target unit

```text
> **Ghi chú chuyển tiếp (2026-10-02):** Engine coordination và khái niệm `CoordinationSession`/`CoordinationProtocol`/`FlowDefinition` đã được thu hồi ở P4. Mọi lần chạy độc lập quy về **Unit run** qua Pattern cộng tác (`CollaborationPattern`: `solo`, `reviewed`, `panel` + preset) hoặc **Workflow run** (`src/workflow/**`). Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08.
```

### Full diff

```diff
No text difference.
```

## claim_ba3f27a8e3fd4763efcfdbd1858b5789

Source digest: fd8ce1aa63a5c152cadc1044080acf480f824b655a1b835583c6d875192e5700

Target digest: fd8ce1aa63a5c152cadc1044080acf480f824b655a1b835583c6d875192e5700

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-114",
  "sourceLines": [
    1366,
    1385
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "nativeTargetClaimId": "claim_92c2718f0152f2122a994a6cfd78c554",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ba3f27a8e3fd4763efcfdbd1858b5789",
    "sourceUnitDigest": "fd8ce1aa63a5c152cadc1044080acf480f824b655a1b835583c6d875192e5700",
    "targetOwner": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-114 (lines 1366–1385) carried at docs/platform/runner/decisions/h-aabefc85f0c9.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "fd8ce1aa63a5c152cadc1044080acf480f824b655a1b835583c6d875192e5700",
    "targetAncestry": [
      "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
      "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
    ]
  }
}
```

### Full source unit

```text
Đây là mô tả tầm SPEC (BA-grade, WHAT chứ không phải code) của ranh giới
`CoordinationSession` đã được chốt ở Phase 00 của track `step-08-standalone-
coordination` — canonical đầy đủ (schema, ADR, ví dụ) sống ở
`docs/architect/agent-coordination/`; mục này chỉ tóm lược đủ để một phiên
session engine + quorum/retry/cancellation + hard-budget/security hardening
đều đã có thật tại `src/runner/coordination/{schema,store,replay,
session-engine}.mjs` (test: `test/runner/coordination-*.test.mjs`) —
store/schema/events/direct cutover từ `mission-lite.mjs` cũ (đã xoá). Phase
06 R5-R7 (cell P06.2): `aggregateBounds` enforcement nay ĐỒNG NHẤT trên mọi
đường dispatch (trước đó, đường agent-led `dispatchPrimaryTask`/
`proposeConsult` không forward 3 cap concurrency-sensitive nào và không
chạy check wall-time/task-depth — tìm thấy và vá thật, không phải giả định);
`coordinationId` nay bị chặn ký tự an toàn (alnum/underscore/hyphen), đóng
một lỗ path-traversal thật (một `coordinationId` chứa `../` từng tạo được
thư mục THẬT ngoài `.fgos/coordination/sessions/`); `linkResult` nay từ
chối một `runId` không đúng quy ước của chính `assignmentId` nó gắn vào,
ngay tại thời điểm ghi (đóng một lỗ foreign-evidence thật, dù lỗ đó chưa
từng dẫn tới false-success vì đọc lại luôn fail-closed). Phase 06 R8 (đóng
độc lập bởi Reviewer+Red-Team cho toàn ma trận recovery/budget R1-R7) là
bước tiếp theo của Coordinator sau cell P06.2, chưa phải việc của Doer.
```

### Full target unit

```text
Đây là mô tả tầm SPEC (BA-grade, WHAT chứ không phải code) của ranh giới
`CoordinationSession` đã được chốt ở Phase 00 của track `step-08-standalone-
coordination` — canonical đầy đủ (schema, ADR, ví dụ) sống ở
`docs/architect/agent-coordination/`; mục này chỉ tóm lược đủ để một phiên
session engine + quorum/retry/cancellation + hard-budget/security hardening
đều đã có thật tại `src/runner/coordination/{schema,store,replay,
session-engine}.mjs` (test: `test/runner/coordination-*.test.mjs`) —
store/schema/events/direct cutover từ `mission-lite.mjs` cũ (đã xoá). Phase
06 R5-R7 (cell P06.2): `aggregateBounds` enforcement nay ĐỒNG NHẤT trên mọi
đường dispatch (trước đó, đường agent-led `dispatchPrimaryTask`/
`proposeConsult` không forward 3 cap concurrency-sensitive nào và không
chạy check wall-time/task-depth — tìm thấy và vá thật, không phải giả định);
`coordinationId` nay bị chặn ký tự an toàn (alnum/underscore/hyphen), đóng
một lỗ path-traversal thật (một `coordinationId` chứa `../` từng tạo được
thư mục THẬT ngoài `.fgos/coordination/sessions/`); `linkResult` nay từ
chối một `runId` không đúng quy ước của chính `assignmentId` nó gắn vào,
ngay tại thời điểm ghi (đóng một lỗ foreign-evidence thật, dù lỗ đó chưa
từng dẫn tới false-success vì đọc lại luôn fail-closed). Phase 06 R8 (đóng
độc lập bởi Reviewer+Red-Team cho toàn ma trận recovery/budget R1-R7) là
bước tiếp theo của Coordinator sau cell P06.2, chưa phải việc của Doer.
```

### Full diff

```diff
No text difference.
```

## claim_49b0591431ed2d1e033a6b960a760e1f

Source digest: c24373f085777c3f0f463c6073f22f2a495fefcc4ace8c4825dc1607beafee2a

Target digest: c24373f085777c3f0f463c6073f22f2a495fefcc4ace8c4825dc1607beafee2a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-115",
  "sourceLines": [
    1387,
    1396
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "nativeTargetClaimId": "claim_860198a9342d0f5e462db248462fbe9f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_49b0591431ed2d1e033a6b960a760e1f",
    "sourceUnitDigest": "c24373f085777c3f0f463c6073f22f2a495fefcc4ace8c4825dc1607beafee2a",
    "targetOwner": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-115 (lines 1387–1396) carried at docs/platform/runner/decisions/h-aabefc85f0c9.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c24373f085777c3f0f463c6073f22f2a495fefcc4ace8c4825dc1607beafee2a",
    "targetAncestry": [
      "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
      "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
    ]
  }
}
```

### Full source unit

```text
**CoordinationSession là gì.** Một lần điều phối agent có biên (bounded) —
objective, actor, budget, task/Assignment runtime khi cần, kết quả tổng hợp —
có thể chạy ĐỘC LẬP với Work (`workId: null`, không Stage, không TaskSpec,
không protocol) hoặc tham chiếu Work chỉ như context đọc-thôi. Nó là ROOT
thực thi/phục hồi của V1 — nghĩa là một phiên bị crash/resume tra cứu tiến độ
qua đúng bản ghi này, không qua đâu khác. CoordinationSession sở hữu tiến độ
điều phối, KHÔNG BAO GIỜ sở hữu vòng đời Work (bất biến cũ vẫn giữ nguyên,
xem `docs/architect/agent-coordination/architecture/work-integration.md`).
Chi tiết schema: `docs/architect/agent-coordination/contracts/coordination-session.md`;
quyết định nền: `docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md`.
```

### Full target unit

```text
**CoordinationSession là gì.** Một lần điều phối agent có biên (bounded) —
objective, actor, budget, task/Assignment runtime khi cần, kết quả tổng hợp —
có thể chạy ĐỘC LẬP với Work (`workId: null`, không Stage, không TaskSpec,
không protocol) hoặc tham chiếu Work chỉ như context đọc-thôi. Nó là ROOT
thực thi/phục hồi của V1 — nghĩa là một phiên bị crash/resume tra cứu tiến độ
qua đúng bản ghi này, không qua đâu khác. CoordinationSession sở hữu tiến độ
điều phối, KHÔNG BAO GIỜ sở hữu vòng đời Work (bất biến cũ vẫn giữ nguyên,
xem `docs/architect/agent-coordination/architecture/work-integration.md`).
Chi tiết schema: `docs/architect/agent-coordination/contracts/coordination-session.md`;
quyết định nền: `docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md`.
```

### Full diff

```diff
No text difference.
```

## claim_f572736a09f2e9266fa2f6b26ffb72ea

Source digest: 4ed88ac3a8b8a5561c875bb1d64928264a79047338e413aade84047c7fe6da6a

Target digest: 4ed88ac3a8b8a5561c875bb1d64928264a79047338e413aade84047c7fe6da6a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-116",
  "sourceLines": [
    1398,
    1414
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
  "targetAnchor": "unheaded-block-6",
  "targetAncestry": [
    "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
    "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
  ],
  "nativeTargetClaimId": "claim_4e051e5d0329aa5bc803f0312e228974",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "coordinationsession-lịch-sử-đã-thu-hồi-per-p4-thay-bằng-collaborationpattern-workflow-runner",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f572736a09f2e9266fa2f6b26ffb72ea",
    "sourceUnitDigest": "4ed88ac3a8b8a5561c875bb1d64928264a79047338e413aade84047c7fe6da6a",
    "targetOwner": "docs/platform/runner/decisions/h-aabefc85f0c9.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-116 (lines 1398–1414) carried at docs/platform/runner/decisions/h-aabefc85f0c9.md#unheaded-block-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "4ed88ac3a8b8a5561c875bb1d64928264a79047338e413aade84047c7fe6da6a",
    "targetAncestry": [
      "Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)",
      "CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)"
    ]
  }
}
```

### Full source unit

```text
**Recheck-discharge quorum fix (2026-09-18).** `closeSessionByQuorum`'s
multi-operation-per-actor path (P10-KERNEL-FIX) trước đây chấm một gating
operation bắt buộc (`review-candidate`/`red-team-candidate`) là `failed`
VĨNH VIỄN một khi verdict là `findings` — dù fix-round sau đó
(`reviewer-recheck`/`red-team-recheck`) đã pass sạch, vì hai operation id
khác nhau nên `resolveBindingOutcome` không bao giờ liên hệ được. `close.json`
vì vậy refuse mãi với `missing required actor(s)` cho MỌI cell từng có dù
chỉ 1 finding ở first-pass — phát hiện thật khi chạy `fgos-code-panel` lần
đầu tới bước close (`code-panel--r3-p1-remote-projector-presenter`). Sửa:
Pattern cộng tác binding thêm field `rechecks: <operationId>` (`definitions/
schema.mjs`, khai trên `reviewer-recheck`/`red-team-recheck` trong
`standalone-master-coordination-loop.yaml`); `session-engine.mjs`'s
`resolveRecheckDischarge` cho một recheck ĐÃ declare, cùng actor, dispatch
SAU `result-linked` của attempt failed, VÀ đã có `driver-disposition-recorded`
nhắm đúng assignment failed đó, mới được discharge slot — không suy luận
theo role/graph-adjacency/naming, không parse nội dung disposition. Test:
`test/runner/coordination-recheck-discharge.test.mjs`.
```

### Full target unit

```text
**Recheck-discharge quorum fix (2026-09-18).** `closeSessionByQuorum`'s
multi-operation-per-actor path (P10-KERNEL-FIX) trước đây chấm một gating
operation bắt buộc (`review-candidate`/`red-team-candidate`) là `failed`
VĨNH VIỄN một khi verdict là `findings` — dù fix-round sau đó
(`reviewer-recheck`/`red-team-recheck`) đã pass sạch, vì hai operation id
khác nhau nên `resolveBindingOutcome` không bao giờ liên hệ được. `close.json`
vì vậy refuse mãi với `missing required actor(s)` cho MỌI cell từng có dù
chỉ 1 finding ở first-pass — phát hiện thật khi chạy `fgos-code-panel` lần
đầu tới bước close (`code-panel--r3-p1-remote-projector-presenter`). Sửa:
Pattern cộng tác binding thêm field `rechecks: <operationId>` (`definitions/
schema.mjs`, khai trên `reviewer-recheck`/`red-team-recheck` trong
`standalone-master-coordination-loop.yaml`); `session-engine.mjs`'s
`resolveRecheckDischarge` cho một recheck ĐÃ declare, cùng actor, dispatch
SAU `result-linked` của attempt failed, VÀ đã có `driver-disposition-recorded`
nhắm đúng assignment failed đó, mới được discharge slot — không suy luận
theo role/graph-adjacency/naming, không parse nội dung disposition. Test:
`test/runner/coordination-recheck-discharge.test.mjs`.
```

### Full diff

```diff
No text difference.
```
