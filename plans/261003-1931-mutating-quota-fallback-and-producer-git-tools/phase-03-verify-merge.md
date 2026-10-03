---
phase: 3
title: "Nghiệm thu + merge"
status: completed
priority: P1
effort: "0.1d"
dependencies: [1, 2]
---

# Phase 3: Nghiệm thu + merge

## Overview

Gộp hai nhánh, full suite, một lần chạy thật qua pane herdr, merge `main`.

## Requirements

- Functional:
  - Merge `fix/mutating-quota-fallback` + `fix/producer-git-tools` vào nhánh tích hợp; full `npm test` xanh (2 test chập chờn đã biết: nếu đỏ, chạy riêng xanh → ghi rõ, không chặn).
  - Chạy thật trong session herdr, executor giả (không API): producer `workspace-write`, candidate đầu in màn hình limit → candidate kế chạy qua cổng mutating → runner commit trên nhánh Unit. Ghi `unitRunId`, `attempts[]` (skipCandidateIndex/candidateIndex), commit sha vào `reports/acceptance.md`; copy bằng chứng vào `reports/evidence/` trước khi dọn. Không chạy được → NOT RUN + lý do.
  - Merge `main` (`--no-ff`) từ checkout chính đang ở `main`; dọn worktree/nhánh.

## Related Code Files

- Create: `reports/acceptance.md`, `reports/evidence/**`

## Implementation Steps

1. Merge; suite. 2. Chạy thật; báo cáo. 3. Merge `main`; dọn.

## Success Criteria

- [ ] Suite xanh; bằng chứng fallback producer; merge `main`.

## Risk Assessment

- Không có session herdr → chạy cùng ca qua cli (headless), ghi NOT RUN cho phần pane.
