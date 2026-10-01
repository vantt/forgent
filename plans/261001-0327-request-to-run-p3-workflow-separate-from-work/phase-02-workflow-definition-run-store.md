---
phase: 2
title: "Workflow + Workflow run store + runner"
status: pending
priority: P1
effort: "2.5d"
dependencies: [1]
---

# Phase 2: Workflow + Workflow run store + runner

## Overview

Xây lớp Workflow độc lập với Work: schema định nghĩa (đọc `domains/<d>/workflows/*.yaml`), store Workflow run (JSONL), **một runner**: tuần tự bước theo `dependsOn`, mỗi bước sinh Unit (template + input) → `fgos run`; cổng người park và gom câu hỏi; bước không phụ thuộc cổng vẫn chạy; resume từ log.

## Requirements

- Functional:
  - Nạp **ba tầng** như `protocol-loader.mjs` hiện có: `core/workflows/*.yaml` (dạng thảo luận dùng chung mọi domain — P4 dùng), `domains/<d>/workflows/*.yaml`, project `.fgos/workflows/*.yaml`; project đè domain đè core theo id.
  - `src/workflow/definition.mjs`: validate Workflow (steps, `dependsOn`, `units[].template` (capability, pattern, rigor, taskSpec, persona khoá nếu có — Q6), `gate`); từ chối ghim hạ tầng (G2).
  - `src/workflow/store.mjs`: `.fgos/workflow-runs/<id>/events.jsonl` (append-only, claim nguyên tử như store hiện có); đăng ký setup/doctor.
  - `src/workflow/runner.mjs`: `start(workflowId, input)`, `advance(runId)`, `answer(runId, answers)`; bước sẵn sàng → dựng Unit (objective từ input/kết quả bước trước; `taskSpec` resolve thành `inputs`) → gọi `fgos run` (qua hàm execution của P1, không qua shell) → ghi `unit-result`; outcome `findings`/`needs-human` → park + câu hỏi; gom câu hỏi của mọi bước đang park thành **một bộ**.
  - Verb: `fgos workflow start|status|answer|resume` (hoặc theo quyết định câu hỏi mở 1).
  - Không import `src/state/**` (Workflow độc lập với Work — chạy được không cần Work).
- Non-functional: runner chỉ tuần tự **bước**; vòng lặp trong một Unit thuộc Pattern cộng tác.

## Architecture

```text
fgos workflow start <id> --input … ─► run log ─► ready steps ─► Unit(template+input) ─► execution.run (P1) ─► unit-result
                                                          └► gate human ─► park ─► câu hỏi gom ─► answer ─► advance
```

## Related Code Files

- Create: `src/workflow/definition.mjs`, `store.mjs`, `runner.mjs`, `index.mjs`; test `test/workflow/*.test.mjs`
- Modify: `bin/fgos.mjs`, `src/cli/command-registry.mjs` (verb `workflow`), `src/setup/registrations.mjs` (store), `docs` lệnh

## Implementation Steps

1. Test trước với Workflow fixture 4 bước (2 song song, 1 cổng người, 1 phụ thuộc cổng): bước song song chạy cùng lúc; park ở cổng; bước không phụ thuộc vẫn chạy; câu hỏi gom một bộ; answer → chạy tiếp; resume sau kill.
2. Viết 3 module + verb; `run` thật được tiêm (test dùng giả).
3. Guard: `src/workflow/**` không import `src/state/**`, `src/runner/coordination/**`.
4. Commit → merge nhánh plan.

## Success Criteria

- [ ] 6 ca ở bước 1 xanh; guard xanh; store có doctor check.

## Risk Assessment

- Thiết kế runner lệch kết quả ca 1 P1 (vd cần thêm trạng thái) → điều chỉnh ở phase 1, không ở đây.
