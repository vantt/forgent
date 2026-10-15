# Added in candidate: Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)


```txt
Document type: Decision record
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve frozen-map runner content for independent conservation review
Design status: Candidate
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing runner carriage, placement and conservation
Do not use this for: Canonical behavior, source retirement or current truth proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/runner.md
Supersedes: None; legacy authority retained
Superseded by: None
```

> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Placement in decisions does not declare the subject retired. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim.

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
