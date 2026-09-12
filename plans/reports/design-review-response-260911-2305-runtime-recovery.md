# Design Review Response: Runtime Recovery Detailed Design

Ngày: 2026-09-11

Review nguồn: [design-review-260911-2233-runtime-recovery-detailed-design](design-review-260911-2233-runtime-recovery-detailed-design.md)

## Kết luận

Verdict **Chưa ổn** được giữ vì B01 là mâu thuẫn contract và B04 là blocker của
toàn bộ S2 launch reconciliation. B04 không phụ thuộc writable takeover: nếu
không tìm lại được orphan sau bind/crash thì read-only takeover vẫn có thể spawn
trùng. Hình dạng hexagonal/SRP vẫn giữ; không có finding nào đòi làm lại toàn bộ
Agent Coordination. Bản thiết kế cũ chỉ claim một số profile capability sớm hơn
các primitive hiện có. Bản sửa này
không mở thêm subsystem; nó thu hẹp capability, đặt owner cho phần còn thiếu,
và biến các exit-evidence không chứng minh được thành dependency/gate.

## Disposition

| Finding | Xử lý |
|---|---|
| B01 | Đóng ở profile đầu: parent terminal luôn refuse transfer. Không append event sau terminal; replay semantics hiện tại được giữ nguyên. Terminal bookkeeping là một replay-version change riêng. |
| B02 | Đóng bằng cách hạ writable takeover về park. `workspaceGrantRef` chỉ hợp lệ khi có issuer cụ thể: workspace-grant repository hoặc Work-runner claim. Không còn claim “existing owner”. |
| B03 | Hạ scope: dependency của same-workspace writable takeover hoặc acceptance dựa trên inherited edits. Read-only/isolated replacement vẫn dùng per-Run delta evaluator; X05 là proof gate riêng cho writable profile. |
| B04 | **S2 blocker cho mọi profile.** Cần gateway-side lookup theo durable launch identity để F-b/F-f không spawn trùng. Deterministic name theo `runId` chỉ là lookup aid strategy hiện có của Herdr client, không phải authority. |
| W01 | Behavior change production được gọi tên; S0 freeze fixture trước khi đổi `blocked`/`paused-limit` sang park. Không phải architectural defect. |
| W02 | Giữ no-TTL-steal. Force-release cho host dài hạn là product gate, không tự thêm. |
| W03 | Herdr resend-until-ack là transport behavior; X02 chỉ cấm duplicate semantic delivery sau ack/working. Đây là proof wording, không phải lỗi kiến trúc. |
| W04 | Recover chỉ thực thi action planner chọn; không tự chạy close-after-steps. |
| W05 | Driver identity là policy/product dependency: manifest grant hoặc replacement door; chưa coi là architectural failure. |
| W06 | Compiler mismatch là implementation dependency; fallback truyền scoped compiler override, không bypass compiler. |
| W07 | S4 implementation dependency: extract read-side legal-next/authorization evaluator rồi write doors dùng chung evaluator đó. |
| W08 | Tracking adapter được ghi rõ là consumer-owned; core chỉ lưu correlation và validate shape. |
| W09 | Read-only boundary nằm ở executor DispatchPlan: provider allowlist derive từ `providerModel`/executor facts; operation chỉ khai external sinks có thể lặp. `mutation` một mình không mở quyền retry. Đây là S3 dependency. |

## Feasibility after correction

- **S0-S1:** khả thi trên Node: fixtures, Run admission/fencing, exact retry
  identity, generation lock.
- **S2:** chưa ship được cho đến khi B04 có primitive và F-b/F-f pass. Sau đó
  reattach/observe/reconcile, material capture sau quiescence, và read-only/
  isolated takeover khả thi. Writable cùng-workspace park cho tới khi workspace
  grant tồn tại; inherited-edit acceptance còn cần Run Result Evaluator.
- **S3:** pre-delivery fallback và operation đã khai báo read-only có thể ship;
  unknown delivery/effect và mutating repeat đều park.
- **S4:** planner/show chỉ ship sau khi read evaluator được extract.
- **S5:** vẫn chờ continuation/replay semantics và backlog engine đã nêu trong
  review; không được gọi là production-ready chỉ vì schema đã viết.

## Product gates cần chốt

Khuyến nghị conservative của thiết kế là:

1. driver mất thì cần replacement-driver grant, không tự nhận writer identity;
2. parent terminal không transfer;
3. repeat mode phải khai báo explicit, không suy ra chung từ mutation;
4. process sống không bị force-release tự động; operator door (nếu có) phải là
   một quyết định và audit contract riêng.

Các khuyến nghị này giữ nguyên SRP: runtime chỉ quan sát và lập kế hoạch,
operation owner quyết định effect policy, còn engine giữ authorization/quorum.

## Audit Corrections

- **B04 remains S2-wide:** `F-b` and `F-f` require orphan lookup before any
  replacement, including read-only recovery. A deterministic name is only a
  lookup aid; `agentSession` and incarnation checks remain authority guards.
- **Read-only effect boundary:** provider allowlist is derived from the selected
  executor/DispatchPlan (`providerModel` and executor facts), not repeated in
  every operation contract. Operations declare only repeatable external sinks;
  sinks that can change outcomes require their own dedup identity.
- **Driver replacement replay:** the replay invariant is that replay does not
  consult mutable trusted config. Current-caller authorization is checked at the
  write door; replay checks shape, identity, ordering and single-use invocation.
  No config snapshot is required.

These corrections preserve the original evidence sources: F-b/F-f for launch
reconciliation, the Dispatch Control Plane provider model for executor facts,
and the existing driver-identity/replay rules for the replacement door.

## Files updated

- `docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
- `docs/architect/agent-coordination/architecture/run-handle.md`
- `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md`
- `docs/architect/agent-coordination/architecture/executor-health-and-fallback.md`

Đây là sửa tài liệu/contract proposal; chưa có code implementation và chưa có
test runtime mới nào được claim là xanh.
