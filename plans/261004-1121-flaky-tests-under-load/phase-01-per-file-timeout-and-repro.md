---
phase: 1
title: "Giới hạn thời gian mỗi file + tái hiện dưới tải"
status: pending
priority: P2
effort: "0.25d"
dependencies: []
---

# Phase 1: Giới hạn thời gian mỗi file + tái hiện dưới tải

## Overview

Lưới an toàn trước: không file nào treo cả giờ. Sau đó dựng cách tái hiện có kiểm soát để phase 2/3 sửa có bằng chứng.

## Requirements

- Functional:
  - `scripts/run-tests.mjs`: giới hạn thời gian mỗi file (mặc định 10 phút, cấu hình qua env/flag); quá hạn → kill **cả cây tiến trình** (process group), in tên file + thời gian, ghi vào tổng kết, exit ≠ 0; các file khác vẫn chạy. Override theo file cho test chậm hợp lệ (Rust harness, release-tree) bằng danh sách tường minh.
  - Kiểm hàng rào chống rò `.fgos` hiện có vẫn chạy sau khi kill.
  - Cách tái hiện: script/hướng dẫn chạy 3 file lặp N lần dưới tải giả (vòng CPU song song bằng `node -e` hoặc `stress-ng` nếu có; thêm `--test-concurrency` cao); ghi lệnh vào `reports/repro.md` kèm kết quả trước khi sửa (tỉ lệ đỏ/treo).
- Non-functional: không đổi thứ tự/nhóm chạy hiện có ngoài phần timeout.

## Related Code Files

- Modify: `scripts/run-tests.mjs`
- Tests: `test/scripts/run-tests.test.mjs` (file giả treo → bị kill, báo đúng tên, suite tiếp tục)
- Create: `reports/repro.md`

## Implementation Steps

1. Worktree `../forgentX-flaky` từ `main` (nhánh `fix/flaky-tests-under-load`); symlink `node_modules`, `target`.
2. Test trước cho timeout mỗi file; sửa `run-tests.mjs`; commit.
3. Dựng tái hiện; chạy; ghi tỉ lệ vào `reports/repro.md`; commit.

## Success Criteria

- [ ] Test timeout mỗi file xanh; tái hiện có số liệu trước khi sửa.

## Risk Assessment

- Kill process group bỏ sót tiến trình con detach (herdr/pane giả) → test với con detach; dùng `detached: true` + `process.kill(-pid)`.
