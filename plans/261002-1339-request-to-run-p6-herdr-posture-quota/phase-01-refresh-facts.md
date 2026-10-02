---
phase: 1
title: "Làm tươi + sự thật"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Làm tươi + sự thật

## Overview

Khớp plan với `main` (P5 có thể đã merge); xác lập sự thật trước khi nối: posture hôm nay đi đường nào, spike herdr+bwrap đã chứng minh gì, invocation herdr nào có trong config.

## Requirements

- Functional:
  - Nhánh `plan/261002-request-to-run-p6` + worktree `../forgentX-p6` từ `main`; symlink `node_modules` **và** `target`; GitNexus analyze (hoặc ghi degraded).
  - Trả lời bằng `file:line`:
    1. Spike `plans/261001-0327-request-to-run-p1-execution-core/reports/spike-herdr-bwrap.md` chạy qua đường code nào (driver `confinement/drivers/bwrap.mjs`? lệnh tay?) — nó có chứng minh `fgos run` áp posture không.
    2. Đường confinement hiện hành của `executeAssignment` (`isReadOnlyMode`, `confinement.backend` trên invocation, policy `host-write-denied`/`workspace-write`) — đây là đường duy nhất sẽ giữ.
    3. `bind()` chọn `invocation` thế nào; khi `transport = herdr`, invocation herdr nào được chọn; `run.mjs:344` truyền `preferInvocation` — vì sao vẫn ra cli.
    4. Executor nào trong `.fgos/config.json` có invocation `herdr-spawn`; `herdr` binary + `HERDR_ENV` có trên máy.
    5. `liveness.mjs` phát `provider-limit` ở đâu; đường từ đó tới `run.mjs`/pattern.
  - Ghi kết luận vào `plan.md` (mục "Sự thật phase 1"); sửa phase 2–4 nếu lệch.
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `plan.md`, `phase-02..04` của plan này.

## Implementation Steps

1. Worktree + symlink + GitNexus.
2. Đọc code, trả lời 5 câu, ghi `file:line`.
3. Commit plan.

## Success Criteria

- [ ] 5 câu có câu trả lời kèm `file:line`; phase 2–4 khớp.

## Risk Assessment

- Spike hoá ra chạy tay, không qua code → phase 2 phải tự chứng minh posture qua `fgos run`; không đổi hướng.
