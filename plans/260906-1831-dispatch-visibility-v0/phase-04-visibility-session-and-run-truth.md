# Phase 04 — VisibilitySession và Run truth

Lease: `run-truth` | Vào được sau: Phase 03

## Context

- Thiết kế: [§8.6 gateway resilience](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md), §5 hard boundary, §8b.2 layout run dir.
- Khiếm khuyết hiện tại: `run.json` ghi `status: "running"` trước khi spawn và **không bao giờ** cập nhật; `paneId` chỉ tồn tại trong kết quả tạm của adapter, không được persist; pid không bao giờ ghi; không có reconcile cho Run mồ côi sau khi process dispatch chết.
- Ràng buộc: V-011 — không tạo entity mới khi run dir đã đủ thẩm quyền.

## Requirements

R1. `visibility.json` sống **trong run dir**, không phải entity riêng:

```json
{ "status": "requested|pane-created|agent-ready|briefed|working|detached|settling|reconciled|died|blocked",
  "paneId": "wS:p238", "terminalId": "term_…", "agentName": "<runId>",
  "agentSession": {"agent":"claude","kind":"id","source":"herdr:claude","value":"…"},
  "actor": {"pid": 123, "token":"…", "leaseUntil": "…"},
  "stateChangeSeq": 27, "lastSeenAt": "…" }
```

R2. Binding được ghi **trước** khi dùng: paneId ngay sau `pane split`, `agentSession` ngay sau
`agent start` (P6 chứng minh nó có sẵn ở thời điểm đó).

R3. `run.json.status` phản ánh trạng thái thật khi settle. Một Run kết thúc không bao giờ còn kẹt `running`.

R4. Run mồ côi được reconcile: process dispatch chết giữa chừng thì lần đọc sau phải phân biệt được
`settled` (có result trên đĩa), `died`, hay `unknown` — và `unknown` là câu trả lời hợp lệ,
không được biến thành retry tự động hay success.

R5. Observer mất kết nối **không** phải worker chết. Mất gateway hay mất observer chuyển
`visibility.status` sang `detached`; `run.json` không đổi.

R6. Một actor tại một thời điểm, giữ bằng lease pid + token có hạn; nhiều observer chỉ đọc,
không giới hạn số lượng. Observer reconnect không bao giờ tạo contact.

R7. Reattach dùng `agent list` khớp theo `paneId` rồi `agentSession.value`. Pane id của herdr
không tái sử dụng sau khi đóng, nên handle cũ là "không còn", không bao giờ trỏ nhầm pane khác.

## Files

Sửa:
- `src/runner/dispatch/assignment-runner.mjs` — ghi và cập nhật `run.json`, tạo `visibility.json`.

Tạo:
- `src/runner/dispatch/visibility-session.mjs` — một cửa duy nhất đọc/ghi `visibility.json`, cộng hàm reattach và reconcile.
- `test/runner/dispatch-visibility-session.test.mjs` — gồm fixture crash: run dir có `visibility.json` ở `working` mà không có process nào.

## Steps

1. Impact analysis trên `assignment-runner.mjs`'s run-dir writer trước khi sửa.
2. Test đỏ trước cho R3 và R4, dùng fixture crash dựng tay như `coordination-recovery-and-quorum.test.mjs` đã làm.
3. Cài `visibility-session.mjs` với atomic write.
4. Nối vào adapter ở đúng ba điểm: sau split, sau agent start, sau mỗi chuyển trạng thái.
5. Cài reconcile: đọc `visibility.json`, hỏi liveness, quyết định outcome, cập nhật `run.json`.

## Validation

- Test crash: giết process dispatch giữa chừng, chạy reconcile, xác nhận `run.json` không còn `running` và outcome là một trong ba giá trị hợp lệ.
- Test `detached`: giả lập mất observer, xác nhận `run.json` không đổi.
- Live: `herdr agent list` sau khi ghi `visibility.json`, reattach tìm lại đúng pane bằng `agentSession.value`.
- `npm test` xanh.

## Risks and rollback

- **Thêm file vào run dir làm vỡ reader hiện có.** Chặn: chỉ thêm, không đổi tên hay xoá file nào đang có; reader cũ bỏ qua file lạ.
- **Lease sai làm hai actor cùng lái một pane.** Chặn: release kiểm tra danh tính pid cộng token, đúng khuôn split-lock của upstream, để một process đã mất lượt không xoá được lock của người thắng.
- **Rollback**: `visibility.json` là phụ; xoá module và các call site là quay về hành vi cũ.
