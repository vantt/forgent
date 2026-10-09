---
phase: 2
title: "Cửa CLI fgos move --answer --approve"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 2: Cửa CLI fgos move --answer --approve

## Overview
Cho phép verb `move` của CLI tiếp nhận cờ `--approve` khi chuyển trạng thái ra khỏi `awaiting-human` kèm `--answer`, đảm bảo tính thống nhất với `fgos answer --approve`.

## Requirements
- Functional:
  - `src/verbs/state/move.mjs`: `moveUseCase` giải nén `approved` từ options và chuyển tiếp vào `moveWork(dir, { ..., approved })`.
  - `bin/fgos.mjs`: Trong khối `case 'move'`, parse cờ `--approve` (`flags.approve === true || flags.approve === 'true'`) và truyền `approved` vào `moveUseCase`.
  - `src/cli/command-registry.mjs`: Thêm khai báo cờ `--approve` (boolean, optional) cho verb `move` trong registry để hỗ trợ `--help` và tài liệu máy đọc.
- Non-functional:
  - Giữ nguyên invariant: chỉ khi caller cung cấp tường minh `--approve`, trường `approved: true` mới xuất hiện trong payload sự kiện; không có `--approve` thì không set `approved`.

## Related Code Files
- Modify: `src/verbs/state/move.mjs`
- Modify: `bin/fgos.mjs`
- Modify: `src/cli/command-registry.mjs`
- Create/Modify: `test/cli/fgos-verbs-state.test.mjs` (hoặc test tương ứng)

## Implementation Steps
1. Sửa `moveUseCase` trong `src/verbs/state/move.mjs`: thêm `approved` vào destructuring của tham số thứ hai và chuyển tiếp vào `moveWork`.
2. Sửa `bin/fgos.mjs` tại `case 'move'`: thêm `const approved = flags.approve === true || flags.approve === 'true';` và đưa vào lời gọi `moveUseCase`.
3. Sửa `src/cli/command-registry.mjs`: thêm `--approve` vào tham số của `move`.
4. Viết unit/CLI test chứng minh:
   - `fgos move <id> --to todo --answer "ok" --approve` ghi nhận `approved: true` trong event payload và `view.gates[id].approved === true`.
   - `fgos move <id> --to todo --answer "ok"` (không có `--approve`) không có `approved` (hoặc `delete view.gates[id].approved`).

## Success Criteria
- [x] `fgos move` hỗ trợ `--approve` đi kèm `--answer`.
- [x] Test chứng minh `approved: true` được ghi nhận đúng khi có cờ và không ghi nhận khi thiếu cờ.
- [x] `node bin/fgos.mjs move --help` hiển thị cờ `--approve`.

## Risk Assessment
- Rủi ro: caller gọi `move` với các edge không phải từ `awaiting-human`.
- Giảm thiểu: `moveWork` đã có logic tự nhiên: `approved` chỉ có ý nghĩa khi có `answer` (tương tự `replay.mjs`: `if (answer && approved === true)`).
