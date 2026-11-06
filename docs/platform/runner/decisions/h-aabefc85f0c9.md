# Runner CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)


```txt
Document type: Decision record
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading the scope, contracts and implementation limits stated here
Do not use this for: Claims outside the stated scope or unrecorded implementation proof
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/runner/spec.md
Supersedes: The mapped source location; source provenance is retained
Superseded by: None
```

> Body retained from `docs/specs/runner.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; source section numbers and implementation limits remain explicit. Reader routes and authority metadata are adapted to this holder.

## CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)

> **Ghi chú chuyển tiếp (2026-10-02):** Engine coordination và khái niệm `CoordinationSession`/`CoordinationProtocol`/`FlowDefinition` đã được thu hồi ở P4. Mọi lần chạy độc lập quy về **Unit run** qua Pattern cộng tác (`CollaborationPattern`: `solo`, `reviewed`, `panel` + preset) hoặc **Workflow run** (`src/workflow/**`). Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08.

Đây là mô tả tầm SPEC (BA-grade, WHAT chứ không phải code) của ranh giới
`CoordinationSession` đã được chốt ở Phase 00 của track `step-08-standalone-
coordination` — canonical đầy đủ (schema, ADR, ví dụ) sống ở
`docs/platform/agent-coordination`; mục này chỉ tóm lược đủ để một phiên
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
xem `docs/platform/agent-coordination/README.md`).
Chi tiết schema: `docs/platform/agent-coordination/history/retired-engine/contracts/coordination-session.md#historical-file-coordinationsession-persistence-and-recovery-contract`;
quyết định nền: `docs/platform/agent-coordination/history/retired-engine/decisions/ADR-008-coordination-session-and-mission-deferral.md#historical-file-adr-008-coordinationsession-as-v1-recovery-root-one-way-assignment-membership-and-mission-deferral`.

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
