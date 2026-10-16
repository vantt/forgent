# Phase 08: cutover full-suite queue (phạm vi máy)

Wave 2. Nhánh `holder-lock/p08-full-suite`, worktree `.claude/worktrees/hl-p08`. Phụ thuộc: P03. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10).

## Yêu cầu

- `acquireFullSuiteQueue` ([`full-suite-queue.mjs:53`](../../scripts/lib/full-suite-queue.mjs)) thành lease phạm vi máy ở `<lockRoot>/full-suite.lock`: chờ không giới hạn như hôm nay bằng `--try` lặp mỗi 2 s; thông báo "another full-suite run holds..." lấy holder từ `holders()` (nền không liệt kê được: không có pid). Giữ `QUEUE_SWITCH_ENV=off` và `QUEUE_HELD_ENV` (hành vi người dùng có sẵn). Con của suite không được truyền description.
- Xoá: `DEFAULT_LOCK_PATH` cũ (`:20`), `isPidAlive` export (`:23`), `readHolder`, vòng `open('wx')`/`unlinkSync`.
- `scripts/` chạy từ checkout: binary qua `FGOS_HOST_BIN` hoặc activation của checkout; không có → lỗi có tên kèm gợi ý `FGOS_FULL_SUITE_QUEUE=off`.
- **Không đặt tombstone** ở đường `/tmp` cũ (plan.md, bảng hàng rào): nhánh cũ sẽ chạy suite không xếp hàng, vô hại.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `scripts/lib/full-suite-queue.mjs` |
| sửa | `test/scripts/full-suite-queue.test.mjs`, `test/scripts/run-tests.test.mjs` (bản sao lib ở `:262-276` phải kèm `src/holder-lock/` và binary) |

## Test

Hai process `acquireFullSuiteQueue` → một chờ; holder SIGKILL → người chờ vào trong ≤ 2 s; `FGOS_FULL_SUITE_QUEUE=off` không lấy lock. Hẹp: `env -u ... FGOS_HOST_BIN=<build> node --test test/scripts/full-suite-queue.test.mjs test/scripts/run-tests.test.mjs`; rồi full `npm test` (chính nó đi qua hàng đợi mới).

## Dòng CHANGELOG

- Changed: hàng đợi full suite là kernel lock phạm vi máy ở `<state root>/locks/full-suite.lock`. Nhánh tạo trước thay đổi này vẫn dùng hàng đợi cũ ở `/tmp` và không xếp hàng cùng nhánh mới.

## Rollback

Revert commit.
