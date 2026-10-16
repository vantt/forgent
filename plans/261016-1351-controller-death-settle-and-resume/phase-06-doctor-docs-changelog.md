# Phase 06: doctor, spec, intent ledger, CHANGELOG

Wave 1 (docs) và wave 2 (check). Nhánh `controller-death/p06-doctor-docs`, worktree `.claude/worktrees/cd-p06`. Phụ thuộc: P00 (docs); P04 (check). Chủ `registrations.mjs`, `checks.test.mjs`, `CHANGELOG.md`, docs.

## Yêu cầu

**Doctor/setup:**
- `legacy-attempts-stuck`: liệt kê run cũ kẹt; fix = `settleLegacy` (P04); in lý do giữ cho từng run còn lại.
- `units-awaiting-resume`: liệt kê unit `awaiting-resume` (thông tin, `warn` không `fail`) kèm lệnh `fgos run --resume`.
- Đăng ký `dispatch.cancelWaitMs` vào config-merge của setup + check in giá trị (từ chối < `gateKillGraceMs`).

**Docs:**
- `docs/platform/run-supervisor/spec.md`: mục "Controller chết": Ctrl-C → cancel; chết bất thường → attempt settle, unit chờ `--resume`; resume dùng adopt; recover hành động `adopt`.
- [`docs/specs/runner.md`](../../docs/specs/runner.md): ngữ nghĩa `--resume` (không chạy lại attempt đã settle; `supersedesRunId` chỉ khi launch mới); "Lịch sử quyết định": D-quyết định của anh 2026-10-16 (r6 §16) và ghi chú **tự resume hoãn có tên** (điều kiện: phát hiện controller chết + single-taker).
- [`docs/platform/intent-preservation-ledger.md`](../../docs/platform/intent-preservation-ledger.md): hai dòng — tự resume (hoãn), lease cwd tới commit `writes` (kongming N7, hoãn theo D5).
- [`docs/io-contract.md`](../../docs/io-contract.md): mã thoát 130/143 của `fgos run` khi Ctrl-C (kiểm bảng mã thoát hiện có ở mục "Mã thoát").
- `CHANGELOG.md`: `--resume` không chạy lại attempt đã xong; Ctrl-C dừng attempt có tên; `dispatch recover` không còn park vì `result-N.json`; dọn attempt kẹt cũ.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, các docs trên, `docs/specs/reading-map.md` (nếu thêm mục) |

## Test

`node --test test/setup/checks.test.mjs`; link docs bấm được; một H1 mỗi file.

## Tiêu chí nghiệm thu / rollback

Ba check xanh; docs khớp code. Rollback: revert.
