---
phase: 1
title: "Làm tươi"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Làm tươi

## Overview

Đưa plan về khớp code thật sau khi T merge: merge `main`, reindex GitNexus, scout lại mọi `file:line` mà các phase dựa vào, trả lời câu hỏi mở số 3, cập nhật phase lệch. Không mở lại quyết định đã chốt.

## Requirements

- Functional: mọi con trỏ code trong phase 2–8 được kiểm lại; chỗ lệch được sửa trong phase file.
- Non-functional: chỉ sửa tài liệu plan; không sửa code.

## Architecture

Không có. Đầu vào: `main` sau T; synthesis §2 (F1–F30), §6b (9 ràng buộc X), §6c; bản đồ layer.

## Related Code Files

- Modify: các `phase-*.md` của plan này (chỉ phần con trỏ/bước).

## Implementation Steps

1. Kiểm cổng: T đã merge `main` (`rg rigorToTier src` có kết quả); nếu chưa → dừng.
2. Tạo nhánh `plan/261001-request-to-run-p1` + worktree; symlink `node_modules`, `target`; `node .gitnexus/run.cjs analyze`.
3. Scout lại, ghi bảng "con trỏ cũ → mới": `executeAssignment` và 4 caller; cổng mutating (`assignment-runner.mjs` ~521-560); khối redirect (~1428-1455); chọn invocation fallback (~2318-2353); `openDispatchRun` (`cli.mjs` ~260); persona (`assignment.mjs` ~713-765, `assignment-policy.mjs` ~388-391); default `'claude'` (`assignment-policy.mjs` ~290); `deriveOperationCapability`/`bindOperations` (`binding.mjs`); `assertNoPortableExecutorPin` (`session-engine.mjs` ~925-942); 4 import `workflow-stage-graphs` trong dispatch; `resolveTierModel` (của T).
4. Quyết câu hỏi mở 3 (store `unit-runs` mới hay tái dùng `coordination-state`): đọc `packages/coordination-state/rust/src/lib.rs`, `src/runner/coordination/store.mjs` (claim/append); chọn phương án ít khái niệm hơn; ghi lý do vào plan.md.
5. Đọc ADR-006 §6 và tài liệu `fallbackExecutors` (`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`) để chuẩn bị supersede ở phase 5/6.
6. Cập nhật phase 2–8; commit plan trên nhánh plan.

## Success Criteria

- [ ] Bảng con trỏ cũ→mới trong `plan.md` (mục "Làm tươi"); 0 con trỏ chưa kiểm.
- [ ] Câu hỏi mở 3 có quyết định + lý do.
- [ ] Không quyết định đã chốt nào bị đổi mà không có bằng chứng mới ghi rõ.

## Risk Assessment

- T đổi tên/hình hàm khác dự kiến (vd `resolveTierModel`) → cập nhật phase 3; không phải lỗi plan.
