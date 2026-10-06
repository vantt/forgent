---
phase: 2
title: "P3a — Workflow runner + store + tích hợp + dịch plan"
status: done
priority: P1
effort: "3.5d"
dependencies: [1]
---

# Phase 2: P3a — Workflow runner + store + tích hợp + dịch plan

## Overview

Xây **sequencer duy nhất** của hệ thống, độc lập với Work: định nghĩa Workflow (core + domain), Workflow run (store JSONL), runner lập lịch **bước và Unit trong bước** theo `dependsOn`, cổng người (park + gom câu hỏi; bước không phụ thuộc vẫn chạy), **bước tích hợp** (helper merge/worktree thuần git), **dịch plan AgentKit → Workflow** (phase → bước; authorize → cổng người). Mỗi Unit chạy qua `fgos run` của P1 (pane herdr mặc định). **Mốc P3a: merge `main` sau phase này.**

## Requirements

- Functional:
  - **Loader** `src/workflow/loader.mjs`: **chuyển** phần nạp nhiều tầng của `src/runner/definitions/protocol-loader.mjs` (không viết mới); tầng `core/workflows/*.yaml` (dạng thảo luận dùng chung — P4) + `domains/<d>/workflows/*.yaml`; **không** tầng project (red-team mục 12). Snapshot Workflow + config từ checkout chính/global lúc start.
  - **Định nghĩa** `src/workflow/definition.mjs`: steps, `dependsOn`, `units[].template` (capability, pattern, rigor, taskSpec, persona khoá — Q6), `kind: integrate`, `gate`; từ chối ghim hạ tầng (G2); containment cho `taskSpec`.
  - **Store** `src/workflow/store.mjs`: `.fgos/workflow-runs/<id>/events.jsonl` (append-only, claim nguyên tử như store hiện có); `.gitignore`; mọi verb nhận `--dir <mainRoot>` khi chạy từ worktree; setup/doctor.
  - **Runner** `src/workflow/runner.mjs`: `start(def|units|plan, input)`, `advance`, `answer`, `resume`; Unit sẵn sàng (theo `dependsOn` bước + Unit) → `fgos run` (gọi hàm execution của P1, không qua shell); outcome `findings`/`needs-human` → park; gom câu hỏi mọi bước đang park thành **một bộ**; Unit ghi file độc lập chạy song song, mỗi Unit một worktree (qua helper tích hợp).
  - **Tích hợp** `src/workflow/integrate.mjs`: tạo worktree cho Unit ghi file, merge kết quả vào nhánh đích theo thứ tự `dependsOn`, dọn — **thuần git**, tách từ `merge.mjs`/`worktree.mjs` (phần gắn Work giữ nguyên ở đó cho Work); không import `src/state/**`.
  - **Dịch plan** `src/workflow/plan-source.mjs`: plan AgentKit (+ Unit qua `plan-lint --json` nếu P2 phase 2 đã có, nếu chưa thì parser tối thiểu cùng hợp đồng) → Workflow dùng một lần; phase → bước; thứ tự/`blockedBy` → `dependsOn`; **authorize = cổng người** (không parse prose — red-team mục 13); không ghi `plan.md`.
  - **Verb**: mở rộng `fgos workflow` (đã có — stage inspector, `command-registry.mjs:1630`) bằng subcommand `start | status | answer | resume`; hành vi cũ chuyển dưới `fgos workflow stages` cho tới phase 3 xoá.
- Non-functional: `src/workflow/**` không import `src/state/**`, `src/runner/coordination/**`; runner chỉ tuần tự bước/Unit — vòng lặp trong Unit là Pattern cộng tác.

## Architecture

```text
fgos workflow start <id | --units f | --plan dir --phases A..B> ─► run log ─► Unit sẵn sàng ─► integrate.worktree ─► fgos run (P1, herdr) ─► unit-result
                                                                      └► gate human ─► park ─► câu hỏi gom ─► answer ─► advance
                                                                      └► kind: integrate ─► integrate.merge (thuần git)
```

## Related Code Files

- Create: `src/workflow/{loader,definition,store,runner,integrate,plan-source,index}.mjs`; test `test/workflow/*.test.mjs`
- Modify: `src/runner/definitions/protocol-loader.mjs` (chuyển phần chung; phần còn lại cho engine tới P4), `src/runner/merge.mjs`, `src/runner/worktree.mjs` (chỉ tách phần thuần git ra helper, Work gọi lại helper), `bin/fgos.mjs` + `src/cli/command-registry.mjs` (mục `workflow`), `src/setup/registrations.mjs`, `.gitignore`

## Implementation Steps

1. Test trước: Workflow fixture 4 bước (2 song song, 1 cổng người, 1 phụ thuộc cổng); Unit trong bước có `dependsOn`; câu hỏi gom một bộ; resume sau kill; bước integrate merge đúng thứ tự; plan 3 phase (phase 2 chưa duyệt) park ở cổng, `plan.md` không đổi byte; `fgos workflow <stage>` cũ vẫn chạy dưới `stages`.
2. Chuyển loader; viết các module; tách helper tích hợp (Work dùng lại, test Work merge vẫn xanh).
3. Guard: `src/workflow/**` không import `src/state/**`, `src/runner/coordination/**`.
4. Suite (workflow + Work merge + dispatch) → commit → merge nhánh plan → **merge `main` (mốc P3a)**; báo track để P2 bắt đầu.

## Success Criteria

- [x] Các ca ở bước 1 xanh; guard xanh; store có doctor + gitignore.
- [x] Work merge vẫn xanh sau khi tách helper.
- [x] P3a trên `main`.

## Risk Assessment

- Tách helper từ `merge.mjs` (1.968 dòng) vỡ Work → chỉ tách hàm thuần git có test; GitNexus `impact` trước; rollback = revert.
- Thiết kế runner lệch kết quả ca 1 P1 → điều chỉnh ở phase 1, không ở đây.
