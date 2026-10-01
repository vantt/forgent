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

Khớp plan với `main` sau P1: API `fgos run`/Unit run thật, kết quả ca 1 (ảnh hưởng thiết kế runner), đếm **đủ** consumer của `stage`, `fgos workflow` cũ, `dispatch-runs`, phần merge/worktree tách được khỏi Work; trả lời câu hỏi mở bằng đề xuất có bằng chứng.

## Requirements

- Functional: bảng con trỏ cũ→mới; danh sách consumer (Node, Rust, gateway, web, skill, verb, test); ranh giới tách helper tích hợp; danh sách caller `dispatch-runs`/`spawnWorker`/`executeExecutorCli`.
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `phase-*.md` của plan này.

## Implementation Steps

1. Cổng: P1 merge `main`; báo cáo ca 1 có.
2. Nhánh `plan/261001-request-to-run-p3` + worktree; symlink; GitNexus analyze.
3. Đếm: `rg -l "workflow-stage-graphs" src bin`, `rg -l "\.stage\b" src test`, Rust `packages/work-state`, contract `domain-entry-stages.json`, `herdr-plugin` (`rg -c stage`, `pick.rs` gọi verb), skill/verb theo stage, test.
4. Đọc `src/runner/merge.mjs`, `worktree.mjs` → khoanh phần thuần git (tạo worktree, merge nhánh, dọn) tách được cho helper tích hợp; phần gắn Work giữ lại.
5. Đọc `src/runner/definitions/protocol-loader.mjs` → phần loader chung chuyển sang `src/workflow/loader.mjs` (bỏ tầng project).
6. Kiểm verb `fgos workflow` hiện có (`command-registry.mjs:1630`, `bin/fgos.mjs:2163-2172`) → thiết kế subcommand mới không đụng positional cũ.
7. Viết đề xuất câu hỏi mở; gửi owner một lượt; commit plan.

## Success Criteria

- [ ] Danh sách consumer đầy đủ (có số); ranh giới helper tích hợp; thiết kế verb `workflow` không trùng.

## Risk Assessment

- Bỏ sót consumer (web, Rust, test) → kiểm bằng `rg` + test gateway trước phase 3.
