---
phase: 3
title: "Guard từ vựng + boundary cuối"
status: pending
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Guard từ vựng + boundary cuối

## Overview

Mở rộng guard từ vựng chết sang docs/skill (ngoài vùng lịch sử); cập nhật bản đồ component cuối của track; đóng track.

## Requirements

- Functional:
  - `test/runner/dead-vocabulary-guard.test.mjs` (file do plan T tạo; mọi plan trước đã **append**): thêm docs/core/domains/AGENTS.md vào phạm vi, loại trừ module đọc dữ liệu cũ (vd đường map `stage` cũ của P3), loại vùng lịch sử; danh sách từ theo bảng thuật ngữ.
  - `docs/platform/component-boundary.md`: bảng component sau track — Work (bản ghi/board/lifecycle), Workflow (định nghĩa + run + runner + tích hợp), Execution core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture), herdr (transport chính + bề mặt quan sát), Dispatch transport/confinement, Observe, Host/Surface, Packaging; bỏ "Agent Coordination Engine". `Last reviewed` cập nhật.
  - `docs/specs/reading-map.md`: trỏ spec mới (Workflow, execution core) và bỏ spec đã thu hồi.
  - Cập nhật track `plan.md`: trạng thái mọi plan con, bằng chứng; đóng track.
- Non-functional: full `npm test` xanh; merge `main`.

## Related Code Files

- Modify: `test/runner/dead-vocabulary-guard.test.mjs`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `plans/261001-0327-request-to-run-track/plan.md`

## Implementation Steps

1. Guard (test đỏ trước nếu còn sót → sửa).
2. Boundary + reading map.
3. Full suite → merge `main` → đóng track; dọn worktree P5 (và mọi worktree còn lại của track).

## Success Criteria

- [ ] Guard xanh; boundary + reading map đúng với code; track completed.

## Risk Assessment

- Guard quá rộng chặn từ hợp lệ (vd "stage" của release) → danh sách từ có ngữ cảnh/regex chặt; loại trừ tường minh.
