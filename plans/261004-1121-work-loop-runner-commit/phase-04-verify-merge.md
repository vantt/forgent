---
phase: 4
title: "Nghiệm thu + merge"
status: pending
priority: P2
effort: "0.25d"
dependencies: [3]
---

# Phase 4: Nghiệm thu + merge

## Overview

Full suite, một lần chạy thật Work loop, merge `main`.

## Requirements

- Functional:
  - Full `npm test` (env `-u CLAUDE_CODE_SESSION_ID`) xanh **khi máy không có tải nặng khác** (lần trước treo vì thiếu RAM — kiểm `free -m` trước; nếu treo, chạy lại khi máy rảnh, không coi là pass).
  - Chạy thật: một item coding nhỏ qua Work loop (`fgos-runner` / `bin/fgos-runner.mjs --once`) trên store của worktree (`--dir`), executor thật hoặc giả có sửa file → commit do runner tạo trên nhánh item (sha), goal-check pass, worker log ghi `commit: runner`. Chép bằng chứng vào `reports/evidence/` trước khi dọn. Không chạy được → NOT RUN + lý do.
  - `reports/acceptance.md`.
  - Merge `main` (`--no-ff`) từ checkout chính đang ở `main`; không checkout nhánh khác ở đó; dọn worktree/nhánh.
- Non-functional: commit sau mỗi bước.

## Related Code Files

- Create: `reports/acceptance.md`, `reports/evidence/**`

## Implementation Steps

1. Suite. 2. Chạy thật; báo cáo. 3. Merge; dọn.

## Success Criteria

- [ ] Suite xanh; bằng chứng runner commit trong Work loop; merge `main`.

## Risk Assessment

- Không chạy thật được → vẫn merge nếu test e2e phủ, ghi NOT RUN rõ.
