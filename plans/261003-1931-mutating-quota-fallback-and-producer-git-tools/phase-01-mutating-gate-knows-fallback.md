---
phase: 1
title: "Cổng mutating biết fallback"
status: pending
priority: P1
effort: "0.25d"
dependencies: []
---

# Phase 1: Cổng mutating biết fallback

## Overview

Cổng mutating tính lại `bind()` với **cùng điểm bỏ qua** mà runner đã dùng khi fallback, lấy từ dữ liệu runner ghi — không từ assignment.

## Requirements

- Functional:
  - `run.mjs`: mỗi attempt ghi vào `unit.json` (đã có `attempts[]`) thêm `skipCandidateIndex` dùng để bind attempt đó (0-th attempt = -1) và `candidateIndex` của binding.
  - `assignment-runner.mjs:501-516`: tính lại `bind(…, { skipCandidateIndex })` với giá trị lấy từ attempt tương ứng trong `unitRecord` (đọc qua đường hiện có), **chỉ khi** attempt liền trước của cùng vai có outcome `provider-limit`; nếu không → `-1` như cũ. So sánh executor/tier/posture như hiện tại.
  - Không thêm field mới vào Assignment mà cổng tin.
- Non-functional: giữ fail-closed hiện có (thiếu binding → từ chối).

## Related Code Files

- Modify: `src/runner/execution/run.mjs`, `src/runner/dispatch/assignment-runner.mjs`, (nếu cần) `src/runner/execution/bind.mjs`
- Tests: `test/runner/execution/run.test.mjs`, `test/runner/assignment-*.test.mjs`

## Implementation Steps

1. Worktree `../forgentX-mutating-fallback` từ `main` (nhánh `fix/mutating-quota-fallback`); symlink `node_modules`, `target`; GitNexus `impact` `executeAssignment`, `nextCandidate`.
2. Test trước (executor giả in màn hình limit): producer `workspace-write` fallback 0→1 qua cổng; chuỗi 0→1→2; assignment giả mạo ghim executor ngoài chuỗi → vẫn bị từ chối; attempt trước không phải `provider-limit` mà assignment khai binding candidate 1 → từ chối.
3. Sửa; test xanh; commit.

## Success Criteria

- [ ] 4 ca test trên xanh; test cổng hiện có không đổi.

## Risk Assessment

- `unitRecord` ở cổng là bản đọc lúc assignment chạy — phải là bản runner đã persist **trước** khi dispatch attempt mới (`persistUnitRecord()` trước `executeAssignment`); test thứ tự.
