---
phase: 6
title: "Smoke marketing + dọn + boundary"
status: pending
priority: P1
effort: "1d"
dependencies: [4, 5]
---

# Phase 6: Smoke marketing + dọn + boundary

## Overview

Chứng minh Workflow chạy cho domain **không phải code** có cổng người, headless (G4b); xoá bản chiếu profile `Workflow` của vỏ `FlowDefinition` + `workflow-adapter.mjs` + doctor check chiếu; ghi spec, boundary, CHANGELOG; merge `main`.

## Requirements

- Functional:
  - Workflow mẫu `domains/marketing/workflows/content-publish.yaml`: brief (`marketing:research`, solo) → viết (`marketing:write`, reviewed, persona khoá `brand-guardian` ở reviewer) → cổng người duyệt → xuất bản (`marketing:publish`, solo, ghi file trong thư mục thử). Đây là **smoke**, không phải domain marketing thật (chưa có tenant — synthesis §7b).
  - Chạy headless tới cổng, park, câu hỏi gom, trả lời, chạy tiếp tới xong; các vai out-of-process qua pane herdr (G7); Observe thấy mọi lần chạy (Workflow run + Unit run).
  - Xoá: `src/runner/definitions/workflow-adapter.mjs`, profile `Workflow` trong `src/runner/definitions/schema.mjs` (`validateWorkflowProfile`…), doctor check chiếu trong `src/setup/registrations.mjs` (~3595-3700).
  - Docs: `docs/specs/<area work>.md` + spec Workflow mới (hoặc mục trong spec runner — tra `docs/specs/reading-map.md`) "Lịch sử quyết định"; `docs/platform/component-boundary.md`: Work Lifecycle Engine bỏ "status/stage", thêm Workflow (định nghĩa + run + runner) là component; CHANGELOG.
- Non-functional: báo cáo `reports/acceptance.md`.

## Related Code Files

- Create: `domains/marketing/workflows/content-publish.yaml` (+ `registry.yaml` tối thiểu nếu schema cần), `plans/261001-0327-request-to-run-p3-workflow-separate-from-work/reports/acceptance.md`
- Delete: `src/runner/definitions/workflow-adapter.mjs`, test tương ứng
- Modify: `src/runner/definitions/schema.mjs`, `src/setup/registrations.mjs`, `docs/specs/*`, `docs/platform/component-boundary.md`, `CHANGELOG.md`

## Implementation Steps

1. Viết Workflow mẫu; chạy smoke headless; đo.
2. Xoá bản chiếu + doctor check; suite.
3. Docs + boundary + guard; full `npm test` (Node + Rust) → merge `main` → cập nhật track.

## Success Criteria

- [ ] Smoke marketing đạt G4b; Observe đủ.
- [ ] `rg "workflow-adapter|validateWorkflowProfile|projectWorkflowToFlowDefinition" src` rỗng.
- [ ] Boundary + spec + CHANGELOG; merge `main`.

## Risk Assessment

- Thiếu khẩu vị `marketing:*` trong config → `bind()` fallback `write`/`review`/`research`; nếu không có → từ chối có lý do (G6); khai tối thiểu cho smoke.
