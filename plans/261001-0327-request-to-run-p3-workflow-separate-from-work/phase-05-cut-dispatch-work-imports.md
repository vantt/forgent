---
phase: 5
title: "Cắt dispatch khỏi Work"
status: pending
priority: P1
effort: "1d"
dependencies: [3]
---

# Phase 5: Cắt dispatch khỏi Work (A4, phần cũ)

## Overview

Đóng nốt A4: các file dispatch cũ hết import `src/state/workflow-stage-graphs.mjs` và state Work. `taskSpec`/bundle theo stage do Workflow layer cung cấp qua `inputs` của Unit; `operation-choice.mjs` (đường Work → dispatch) chuyển sang gọi Workflow runner hoặc xoá nếu thừa.

## Requirements

- Functional:
  - Xoá import L3 ở `assignment-runner.mjs` (~57), `operation-choice.mjs` (~20), `cli.mjs` (~21: `DOMAINS`, `bundleForStage`, `resolveTaskSpecPath`), `assignment.mjs` (~51), `config.mjs` (state Work).
  - `resolveTaskSpecPath` chuyển sang `src/workflow/**`; dispatch nhận đường dẫn/nội dung qua assignment.
  - `operation-choice.mjs`: chức năng còn cần chuyển vào Workflow runner; phần thừa xoá.
  - Guard test: `src/runner/dispatch/**` và `src/runner/execution/**` không import `src/state/**`, `src/workflow/**` (dispatch ở dưới; workflow gọi xuống, không ngược).
- Non-functional: hành vi chạy không đổi.

## Related Code Files

- Modify: `src/runner/dispatch/assignment-runner.mjs`, `operation-choice.mjs`, `cli.mjs`, `assignment.mjs`, `config.mjs`; `src/workflow/**` (nhận `resolveTaskSpecPath`)
- Modify: `test/architecture.test.mjs` (guard một chiều)

## Implementation Steps

1. GitNexus `impact` từng hàm import.
2. Chuyển; guard; suite dispatch + workflow.
3. Commit → merge nhánh plan.

## Success Criteria

- [ ] `rg "from '.*state/" src/runner/dispatch src/runner/execution` rỗng; guard xanh.
- [ ] `docs/platform/component-boundary.md` dòng Dispatch ("forbids direct workflow/stage lookups") **đúng với code**.

## Risk Assessment

- Caller Work cũ còn gọi `operation-choice` → phase 3 đã chuyển; nếu sót, test đỏ chỉ ra.
