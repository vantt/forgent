---
phase: 1
title: "Sự thật + impact"
status: completed
priority: P2
effort: "0.25d"
dependencies: []
---

# Phase 1: Sự thật + impact

## Overview

Xác lập bằng `file:line` Work loop commit ở đâu, goal-check đọc gì, invocation nào còn cấp git — trước khi đụng `loop.mjs` (CRITICAL).

## Requirements

- Functional — trả lời, ghi vào `plan.md` mục "Sự thật phase 1":
  1. Trong `src/runner/loop.mjs`, điểm worker trả về → goal-check (`runGoalCheck`, import `:88`); chỗ phân loại "worker never committed" (`verify-miss`).
  2. `src/runner/goal-check.mjs` kiểm commit thế nào (đếm commit ahead? diff?).
  3. Mọi nơi còn cấp `Bash(git add|commit)`: `rg -n "Bash\(git (add|commit)" src core domains docs .fgos/config.json`.
  4. Mọi chỗ trong hợp đồng/skill coding yêu cầu worker tự commit (`core/skills/_shared/coding-worker-contract.md:91`, skill `fgos-coding-*`).
  5. `commitUnitWork` (`src/runner/execution/commit-unit-work.mjs:46`) có dùng được cho worktree item không (loại trừ `.fgos/`, identity git, message).
- GitNexus `impact` upstream: `runOnce`/hàm dispatch item của `loop.mjs`, `runGoalCheck`; báo blast radius (CRITICAL → ghi rõ và tiếp tục với test e2e làm lưới).
- Worktree `../forgentX-loop-commit` từ `main` (nhánh `fix/work-loop-runner-commit`); symlink `node_modules`, `target`.
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `plan.md`, `phase-02..04` của plan này.

## Implementation Steps

1. Worktree + symlink + GitNexus. 2. Trả lời 5 câu. 3. Commit plan.

## Success Criteria

- [ ] 5 câu có `file:line`; blast radius ghi lại.

## Risk Assessment

- Goal-check dựa vào "worker đã commit" theo cách khó thay → phase 2 thêm bước runner commit trước goal-check, không đổi goal-check.
