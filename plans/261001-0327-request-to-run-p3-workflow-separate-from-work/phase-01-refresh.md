---
phase: 1
title: "Làm tươi"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Làm tươi

## Overview

Khớp plan với `main` sau P1 (và P2 nếu đã xong); đo lại quy mô stage trong Work; quyết tách phase 3 thành 3a/3b nếu cần; trả lời trước 2 câu hỏi mở bằng đề xuất có bằng chứng để owner chốt một lượt.

## Requirements

- Functional: bảng con trỏ cũ→mới; danh sách đầy đủ consumer của `stage` (Node, Rust, gateway, web, skill, verb); kết quả ca 1 P1 về vòng lặp pattern (ảnh hưởng thiết kế runner).
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `phase-*.md` của plan này.

## Implementation Steps

1. Cổng: P1 merge `main`; báo cáo ca 1 có.
2. Nhánh `plan/261001-request-to-run-p3` + worktree; symlink; GitNexus analyze.
3. Đếm lại: `rg -l "workflow-stage-graphs" src bin`, `rg -l "\.stage\b" src`, Rust `packages/work-state`, `herdr-plugin` (gateway + web types), skill/verb theo stage (`/fgOS:discover|plan|discover-loop|plan-loop|*-next`, `fgos-coding-driving`, `fgos-routing`, `fgos-coding-*`).
4. Đọc `src/state/workflow-stage-graphs.mjs`, `stage-fsm.mjs`, `status-fsm.mjs`, `loop.mjs`, `operation-choice.mjs` để chốt ranh giới runner vs Work status.
5. Nếu tổng thay đổi phase 3 > ~2.000 dòng hoặc > 60 file → tách 3a (runtime + state + Rust) / 3b (skill + verb + gateway/web); cập nhật bảng sóng.
6. Viết đề xuất cho 2 câu hỏi mở (có bằng chứng); gửi owner một lượt; phần không phụ thuộc vẫn tiến.
7. Commit plan.

## Success Criteria

- [ ] Danh sách consumer `stage` đầy đủ; quyết định 3a/3b có lý do; 2 câu hỏi mở có đề xuất.

## Risk Assessment

- Bỏ sót consumer `stage` (web, Rust) → kiểm bằng `rg` + test gateway trước phase 3.
