# Phase 05 — Cửa quan sát chỉ-đọc, doctor, và docs

Lease: `observe-surface` | Vào được sau: Phase 04

## Context

- Thiết kế: [§8.4 observer/actor, §8.5 output channels, §13 docs cần cập nhật](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md).
- Ràng buộc: quyền observe tách hẳn quyền contact. V0 chỉ giao observe. Không verb nào ở phase này được gửi input vào pane.

## Requirements

R1. Hai cửa chỉ-đọc, không hơn:
- `fgos dispatch show-run <runId>` — in `run.json` cộng `visibility.json` cộng danh sách outbox, một lần, JSON theo CTR001.
- `fgos dispatch watch <runId>` — theo dõi liên tục: trạng thái, tiến độ, và tail output. Không bao giờ gọi `agent prompt` hay `send-keys`.

R2. `watch` phải chạy được khi actor là một process khác. Đó chính là điểm của observer:
nhiều người xem, một người lái.

R3. Doctor mở rộng từ Phase 01: thêm check rằng mọi executor khai `adapter: herdr-spawn`
đều có `kind` nằm trong danh sách kind herdr thật sự hỗ trợ, và integration của kind đó
không ở trạng thái `outdated`.

R4. Docs cập nhật đúng những chỗ §13 đã liệt kê, không hơn:

| File | Sửa gì |
|---|---|
| `docs/specs/runner.md` | RUL40 đã re-scope ở phiên trước; phase này thêm mô tả ladder và outcome có type |
| `docs/architect/agent-coordination/architecture/visibility-and-herdr.md` | Thêm invariant "receipt là artifact do bên nhận ghi"; thêm VisibilitySession, observer khác actor, chính sách pane forensics |
| `.../architecture/dispatch-control-plane.md` | Flow thêm `execution capability set` giữa mechanism và Run |
| `.../proposals/dispatch-control-plane-redesign.md` §12.2 | Xoá mô tả temp-script/sentinel đã bị `tsk-by0` xoá, thay bằng hình dạng V0 (đây là nội dung của `tsk-53j` đã đóng, gộp vào đây) |
| `docs/architect/proposals/coordination-dispatch-contract.md` | Câu cuối "Visibility and interactive contact are intentionally outside" trỏ sang tài liệu thiết kế |
| `.../coordination-worker-provider-boundary.md` | Thêm dòng kế thừa `HERDR_*` và socket vào bảng Environment |
| `CHANGELOG.md` | Một dòng dưới `## [Unreleased]` — đây là thay đổi người dùng fgOS thấy được |

R5. Một ADR mới ghi lại điều đã chốt: lifecycle owner là Dispatch, herdr là transport,
receipt là artifact do bên nhận ghi. Đặt cạnh ADR-010.

## Files

Sửa: `src/cli/command-registry.mjs`, `src/setup/registrations.mjs`, bảy file docs ở R4, `CHANGELOG.md`.
Tạo: `src/verbs/dispatch/show-run.mjs`, `src/verbs/dispatch/watch.mjs`, `docs/architect/agent-coordination/decisions/ADR-011-*.md`, test tương ứng.

## Steps

1. Cài hai verb chỉ-đọc, dùng lại `visibility-session.mjs` của Phase 04, không mở cửa ghi thứ hai.
2. Test rằng `watch` từ chối mọi tham số có thể biến nó thành cửa ghi.
3. Mở rộng doctor.
4. Cập nhật docs theo bảng, đọc từng file trước khi sửa.
5. Viết ADR.

## Validation

- `fgos dispatch show-run` và `watch` chạy được trong khi một Run thật đang chạy từ process khác.
- Grep xác nhận không verb nào ở phase này gọi `agent prompt`, `send-text`, hay `send-keys`.
- `npm test` xanh, gồm test kiến trúc và test manifest nếu có.
- Mọi link trong docs sửa đều resolve.

## Risks and rollback

- **Cửa quan sát trượt thành cửa contact.** Chặn bằng test grep ở trên, không chỉ bằng lời hứa.
- **Sửa docs quá tay sang phần chưa chứng minh.** Chỉ sửa đúng bảng R4; thứ chưa đo thì ghi là chưa đo.
- **Rollback**: hai verb mới là phụ; docs revert bằng git.
