---
phase: 2
title: "Runner commit trong Work loop"
status: pending
priority: P2
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Runner commit trong Work loop

## Overview

Chèn một bước: worker trả về → **runner commit** (tái dùng `commitUnitWork`) → goal-check. Sửa hợp đồng worker cho khớp.

## Requirements

- Functional:
  - `loop.mjs`: sau khi worker trả về (cả nhánh thành công lẫn timeout có output), trước goal-check, gọi `commitUnitWork({ worktree, unitId: item.id, summary })`; summary từ Result fenced JSON của worker (nếu có). Cây sạch → không commit (idempotent, chấp nhận worker cũ tự commit). Commit lỗi → phân loại như lỗi hạ tầng hiện có (không nuốt). Ghi `commit: runner | self | none` vào worker log.
  - Không tái tạo logic commit trong `loop.mjs` — chỉ gọi `commitUnitWork` (DRY); mở rộng chữ ký nếu cần (ví dụ identity), có test.
  - Hợp đồng `core/skills/_shared/coding-worker-contract.md` (§3 "Commit your changes, then stop") + skill `fgos-coding-*` liên quan: worker **không** commit; sửa file, chạy verify, trả Result; runner commit. Result vẫn có field `commit` nhưng giải thích là do runner điền. `npm run build:skills`; diff chỉ file liên quan.
- Non-functional: không đổi propose/park/halt, breaker, goal-check.

## Related Code Files

- Modify: `src/runner/loop.mjs`, `src/runner/execution/commit-unit-work.mjs` (nếu cần), `core/skills/_shared/coding-worker-contract.md`, skill coding liên quan, `.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**` (sinh ra)
- Tests: `test/runner/loop.test.mjs`, `test/e2e/runner-loop.test.mjs`, `test/runner/execution/commit-unit-work*.test.mjs`, `test/skills/fgos-mirror.test.mjs`

## Implementation Steps

1. Test trước: worker giả sửa file không commit → runner commit → goal-check pass → propose; worker giả tự commit → runner không commit thêm; worker không sửa gì → hành vi như hiện tại (verify-miss/park); commit lỗi → lỗi hạ tầng.
2. Sửa `loop.mjs`; sửa hợp đồng; build skills.
3. `test/runner/loop.test.mjs`, `test/e2e/runner-loop.test.mjs` xanh; commit.

## Success Criteria

- [ ] 4 ca test trên xanh; test loop/e2e hiện có xanh.

## Risk Assessment

- Test cũ giả định worker tự commit → cập nhật test theo hợp đồng mới **có trong plan này**, không nới assert hành vi khác.
