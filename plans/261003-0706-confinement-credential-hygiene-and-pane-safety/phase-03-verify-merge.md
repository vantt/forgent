---
phase: 3
title: "Nghiệm thu + merge"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1, 2]
---

# Phase 3: Nghiệm thu + merge

## Overview

Gộp hai nhánh, chạy full suite, một lần chạy thật qua pane herdr kiểm M1/M2, merge `main`.

## Requirements

- Functional:
  - Merge `fix/confinement-credential-hygiene` + `fix/pane-dialog-integration-target` vào nhánh tích hợp; full `npm test` (Node + Rust) xanh.
  - Chạy thật trong session herdr (store = worktree tích hợp, `--dir`): (a) một Unit `reviewed` qua pane — sau khi xong, `<dispatchId>/` không còn; trong lúc chạy, `stat` home = 0700; (b) executor giả lập màn hình limit đứng đầu `prefer[]` → pane cũ giữ, path home trong failure record, đóng pane rồi `fgos run` kế → home bị reap. Không chạy được → NOT RUN + lý do.
  - Báo cáo `reports/acceptance.md`: run id, đường dẫn, mode đo được — **không in nội dung credential**.
  - Merge `main` (`--no-ff`) từ checkout chính đang ở `main`; không checkout nhánh khác ở đó; dọn worktree.
- Non-functional: commit sau mỗi bước.

## Related Code Files

- Create: `reports/acceptance.md`

## Implementation Steps

1. Merge hai nhánh; full suite.
2. Chạy thật (a), (b); báo cáo.
3. Merge `main`; dọn worktree.

## Success Criteria

- [ ] Full suite xanh; (a), (b) có bằng chứng hoặc NOT RUN + lý do; merge `main`.

## Risk Assessment

- Không có session herdr → (a)(b) NOT RUN; vẫn merge vì test tự động phủ, ghi rõ trong báo cáo.
