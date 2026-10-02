---
phase: 6
title: "Docs + boundary + đóng track"
status: in-progress
priority: P2
effort: "0.5d"
dependencies: [5]
---

# Phase 6: Docs + boundary + đóng track

## Overview

Ghi hiện trạng đã chứng minh vào spec/bản đồ component; merge `main`; đóng track request-to-run (sau khi P5 đã merge).

## Requirements

- Functional:
  - `docs/specs/runner.md`: transport herdr mặc định / cli fallback, posture một đường, fallback quota — kèm bằng chứng phase 5.
  - `docs/platform/component-boundary.md`: bỏ ghi chú "herdr transport + posture chưa nối" (P5 để lại); `Last reviewed`.
  - `CHANGELOG.md` `[Unreleased]`.
  - Full `npm test` (Node + Rust) xanh trong worktree → `git merge --no-ff` vào `main` từ checkout chính (đang ở `main`, không checkout nhánh khác ở đó).
  - Track `plans/261001-0327-request-to-run-track/plan.md`: P6 done + bằng chứng; nếu P5 đã merge → track `status: done`. Dọn worktree P6.
- Non-functional: guard `test/runner/dead-vocabulary-guard.test.mjs` chỉ append nếu cần.

## Related Code Files

- Modify: `docs/specs/runner.md`, `docs/platform/component-boundary.md`, `CHANGELOG.md`, `plans/261001-0327-request-to-run-track/plan.md`

## Implementation Steps

1. Docs; full suite; merge; cập nhật track; dọn worktree.

## Success Criteria

- [x] Docs khớp bằng chứng: `docs/specs/runner.md` (quyết định 0050), `docs/platform/component-boundary.md` (bỏ ghi chú chưa nối; không đổi bản đồ component), `CHANGELOG.md`.
- [x] Track `plan.md` ghi P6 xong kèm bằng chứng và việc còn mở.
- [ ] Merge `main` (controller, `git merge --no-ff` từ checkout chính).
- [ ] Track `status: done` (controller lật sau merge; P5 đã merge `main`).
- [ ] Dọn worktree P6 (gom cuối track).

## Risk Assessment

- P5 chưa merge → không đóng track; ghi trạng thái, để discussion lead đóng sau.
