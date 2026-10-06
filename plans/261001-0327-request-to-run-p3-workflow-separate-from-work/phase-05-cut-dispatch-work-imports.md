---
phase: 5
title: "P3b — Cắt dispatch khỏi Work + xoá dispatch-runs"
status: done
priority: P1
effort: "1.5d"
dependencies: [3]
---

# Phase 5: P3b — Cắt dispatch khỏi Work + xoá `dispatch-runs`

## Overview

Đóng nốt A4: các file dispatch cũ hết import `src/state/**`. Đường Work → dispatch (`spawnWorker`, fan-out, `operation-choice.mjs`) chuyển sang Workflow runner + `fgos run`; nhờ vậy **xoá được** writer `dispatch-runs` (`openDispatchRun`), `execute <executor>` thường và 3 reader (ngoại lệ có tên của P1 kết thúc ở đây).

## Requirements

- Functional:
  - Xoá import L3 ở `assignment-runner.mjs` (~57), `operation-choice.mjs` (~20), `cli.mjs` (~20-38: `DOMAINS`, `bundleForStage`, `resolveTaskSpecPath`, state), `assignment.mjs` (~51), `config.mjs` (~23, 27); `resolveTaskSpecPath` đã ở `src/workflow/**`.
  - `spawnWorker` (`loop.mjs:83,1035`) và fan-out (`src/runner/fanout-batch.mjs` → `executeExecutorCli`) chuyển sang `fgos run`/runner; `operation-choice.mjs` phần còn cần chuyển vào runner, phần thừa xoá.
  - Xoá `openDispatchRun` + `.fgos/dispatch-runs` writer, `fgos dispatch execute <executor>` thường, reader `show-run.mjs:58-63`, `visibility-session.mjs:234-249`, `runtime-inspection.mjs:83-84` (hoặc chuyển sang đọc assignments). `execute --assignment` giữ cho engine tới P4.
  - Guard: `src/runner/dispatch/**`, `src/runner/execution/**` không import `src/state/**`, `src/workflow/**`.
- Non-functional: hành vi daemon `fgos-runner --watch` và fan-out giữ (qua đường mới) — có test.

## Related Code Files

- Modify: `src/runner/dispatch/{assignment-runner,operation-choice,cli,assignment,config}.mjs`, `src/runner/fanout-batch.mjs`, `src/runner/loop.mjs` (chỉ phần spawn — phase 3 sở hữu phần còn lại; làm sau khi phase 3 merge), reader 3 file, `test/architecture.test.mjs`
- Delete: phần `dispatch-runs`, test tương ứng

## Implementation Steps

1. GitNexus `impact` từng hàm import, `spawnWorker`, `executeExecutorCli`, `openDispatchRun`.
2. Test trước: daemon chạy một item qua đường mới; fan-out chạy N item; không còn file mới dưới `.fgos/dispatch-runs`.
3. Chuyển; xoá; guard; suite.
4. Commit → merge nhánh plan.

## Success Criteria

- [x] `rg "from '.*state/" src/runner/dispatch src/runner/execution` rỗng; guard xanh.
- [x] `rg "openDispatchRun|dispatch-runs" src` rỗng (ngoài đường đọc dữ liệu cũ nếu giữ).
- [x] Dòng Dispatch trong `docs/platform/component-boundary.md` ("forbids direct workflow/stage lookups") **đúng với code**.

## Risk Assessment

- Daemon/fan-out gãy → test bước 2 bắt; rollback = revert merge phase.
