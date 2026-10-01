---
phase: 5
title: "Cửa chạy fgos run"
status: pending
priority: P1
effort: "2.5d"
dependencies: [2, 3, 4]
---

# Phase 5: Cửa chạy `fgos run`

## Overview

Nối Unit + `bind()` + vòng lặp pattern thành **một cửa chạy**: verb `fgos run` → mỗi vai `bind()` → `executeAssignment` (out-of-process) hoặc trả chỉ dẫn in-process/inline cho Lead → RunResult. Đổi cổng ghi file (Q9: bỏ protocol stamp). Ghi RunResult cho cả lần chạy inline. Xoá cửa `dispatch-runs`/`execute` thường. Persona có nội dung. Observe nhóm theo `unitRunId`.

## Requirements

- Functional:
  - **Verb**: `fgos run --unit <file|->` (JSON/YAML Unit) `[--pattern <name|preset>] [--override <json>] [--resume <unitRunId>] [--json]`; một lệnh cho cả Unit (Lead không đứng giữa các vòng — tiêu chí 1, 2). Subverb `fgos run record --unit-run <id> --role <r> --result <file>` để Lead ghi kết quả vai **inline** / **in-process** (RunResult cùng lifecycle, `mechanism` tương ứng).
  - Mỗi vai: `bind()` → nếu `out-of-process`: dựng assignment (`unitRunId`, `role`, `round`, `provenance.binding`, `contract`) và gọi `executeAssignment`; nếu `in-process`/`inline`: trả chỉ dẫn (agentType/model/persona) cho Lead và chờ `run record`. Headless (không Lead) mà `bind()` ra inline/in-process → `bind()` đã từ chối từ trước.
  - Store `.fgos/unit-runs/<unitRunId>/events.jsonl` (hoặc phương án phase 1 chọn): unit, overrides, sự kiện vòng lặp; `--resume` đọc lại; assignment id tất định `unitRunId/role/round`; `admitRunAttempt` giữ "một run chưa settle".
  - **Cổng ghi file (Q9, supersede ADR-006 §6)**: assignment `mutating` được admit khi **(a)** cwd là linked worktree (`resolveMutatingCwdPosture`) **và (b)** có `provenance.binding` hợp lệ từ `bind()`. Bỏ yêu cầu protocol-operation stamp; giữ đường engine chạy được (engine sẽ gắn `provenance.binding` ở phase 7).
  - **Xoá**: `openDispatchRun` + `.fgos/dispatch-runs` writer; `fgos dispatch execute <executor>` dạng thường (chỉ còn `execute --assignment` cho engine tới P4) — kiểm caller trước; ngoại lệ stamp ở `execution-contract.mjs`.
  - **Persona có nội dung**: prompt render mục Persona từ nội dung `core/agents/<persona>.yaml` (`persona`, `decision_boundary`, `voice`…), không chỉ cái tên (F4, F5).
  - **Observe**: RunResult source mang `unitRunId`; case gom theo `unitRunId` (`packages/run-result/rust`, `packages/observe/rust/src/case_journal.rs`).
  - Đăng ký `.fgos/unit-runs/` vào setup/doctor (install gate).
- Non-functional: `src/runner/execution/run.mjs` không import `src/state/**`.

## Architecture

```text
fgos run --unit u ─► validateUnit ─► pattern(name|rule) ─► runPattern(…, runRole = role ─► bind() ─┬► out-of-process: executeAssignment ─► RunResult
                                                                                                └► in-process/inline: chỉ dẫn → Lead → fgos run record ─► RunResult
                                     └► log(event) ─► .fgos/unit-runs/<id>/events.jsonl
```

## Related Code Files

- Create: `src/runner/execution/run.mjs`, `test/runner/execution/run.test.mjs`, `test/cli/run-verb.test.mjs`
- Modify: `src/runner/dispatch/assignment-runner.mjs` (cổng mutating ~521-560, ghi `unitRunId`/`provenance.binding`), `src/runner/dispatch/execution-contract.mjs`, `src/runner/dispatch/cli.mjs` (xoá `openDispatchRun`), `src/runner/dispatch/assignment.mjs` (persona body), `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/setup/registrations.mjs` (unit-runs), `packages/run-result/rust/src/lib.rs`, `packages/observe/rust/src/case_journal.rs`
- Delete: phần writer `dispatch-runs` và test của nó

## Implementation Steps

1. GitNexus `impact` cho `executeAssignment`, `openDispatchRun`, cổng mutating, `renderAssignmentPrompt`/hàm persona; báo blast radius (dự kiến CRITICAL ở `executeAssignment` → báo owner trước khi sửa).
2. Test trước: `fgos run` read-only solo out-of-process; mutating ngoài worktree → từ chối; mutating không `provenance.binding` → từ chối; inline `run record`; resume sau kill giữa vòng 2; persona body có trong prompt; Observe đếm RunResult theo `unitRunId`.
3. Viết `run.mjs`, verb, store, sửa cổng, persona, Observe.
4. Xoá `dispatch-runs`/`execute` thường + caller; cập nhật doc lệnh.
5. Full test dispatch + coordination (engine vẫn phải xanh) → commit → merge vào nhánh plan.

## Success Criteria

- [ ] Một lệnh `fgos run` chạy trọn Unit `reviewed` không cần Lead can thiệp giữa vòng (headless).
- [ ] Cổng mutating mới có test dương + âm; stamp đã xoá.
- [ ] `rg "openDispatchRun|dispatch-runs" src` rỗng (ngoài migration ghi rõ).
- [ ] RunResult inline có `mechanism: inline`; Observe thấy cả hai loại.
- [ ] Coordination engine còn chạy (test engine xanh).

## Risk Assessment

- **Supersede ADR-006 §6** chạm ranh giới an toàn → ghi decision record ở phase 8; test âm bắt buộc. Tín hiệu hỏng: run ghi file xuất hiện ngoài worktree → rollback merge phase.
- Xoá `execute` thường làm gãy skill/doc đang gọi nó → `rg "dispatch execute"` trong `core/`, `domains/`, `docs/` và sửa cùng phase.
