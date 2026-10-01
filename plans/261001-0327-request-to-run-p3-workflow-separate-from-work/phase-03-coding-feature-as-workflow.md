---
phase: 3
title: "P3b — Work không còn stage (state + Rust)"
status: pending
priority: P1
effort: "3d"
dependencies: [2]
---

# Phase 3: P3b — Work không còn `stage` (state + Rust)

## Overview

Chuyển lifecycle coding (discovery → exploring → planning → executing …) từ `stage` của Work sang các bước của Workflow `coding/feature`; Work tham chiếu `workflowRunId`; xoá `stage` khỏi state Work (Node + Rust); `loop.mjs` không còn tuần tự stage. Bề mặt (verb/skill/herdr/web) ở phase 4.

## Requirements

- Functional:
  - `domains/coding/workflows/feature.yaml` viết lại theo schema Workflow: stage → step; operation → unit template (`taskSpec`, `capability` `coding:*`, `pattern`); `dispatch: human-only` → `gate: human`; không `policy` ghim.
  - `domains/coding/registry.yaml`: chỉ giữ phần Workflow dùng.
  - Work (`src/state/work.mjs`, `store.mjs`, `replay.mjs`): bỏ `stage`; thêm `workflowRunId?`. **Tạo mới** version cho view (`viewSchemaVersion` chưa tồn tại; hiện chỉ có `SCHEMA_VERSION` ở `replay.mjs:47`): lệch version → fold lại từ đầu. **Một đường đọc** dữ liệu cũ: event/snapshot có `stage` → map sang Workflow run (kể cả event `stage` mới do binary cũ ở project khác ghi).
  - Pool/frontier/triage/plan-pool/discover-pool/handoff/impact/graph-* đọc bước hiện tại từ Workflow run.
  - `loop.mjs`: bỏ tuần tự stage; Work runner (nếu còn) gọi `runner.advance`.
  - Rust `packages/work-state/rust/src/work_source.rs` (đọc thẳng `state.json` ~86-89) + contract `domain-entry-stages.json`: kiểm cùng version, hiển thị bước từ Workflow run.
  - Xoá `src/state/workflow-stage-graphs.mjs` (logic còn cần đã chuyển vào `src/workflow/definition.mjs`), `src/state/stage-fsm.mjs` nếu thành thừa; `fgos workflow stages` (hành vi cũ) xoá.
- Non-functional: test Work (gồm ~70 file test nhắc `stage` — đếm ở phase 1) + Rust xanh; dữ liệu cũ đọc đúng.

## Related Code Files

- Modify: `src/state/**`, `src/verbs/state/**`, `src/intake/**`, `src/runner/loop.mjs`, `src/runner/claim-port.mjs`, `src/runner/work-compat.mjs`, `src/runner/prompt-templates*`, `domains/coding/workflows/feature.yaml`, `domains/coding/registry.yaml`, `packages/work-state/rust/src/**`, contract `domain-entry-stages.json`, test tương ứng
- Delete: `src/state/workflow-stage-graphs.mjs`, `src/state/stage-fsm.mjs` (nếu thừa)

## Implementation Steps

1. GitNexus `impact`: `resolveWorkflow`, `operationsForStage`, `validateWork`, `rebuildView`, `pickNextPlanItem`, … (CRITICAL dự kiến → báo owner).
2. Test trước: `state.json` hình dạng cũ → đọc ra Workflow run đúng bước; item mới tạo Workflow run; event `stage` mới (binary cũ) → map; Rust đọc version mới.
3. Viết lại `feature.yaml`; chuyển state; Rust.
4. Xoá cái cũ; `rg "\.stage\b|workflow-stage-graphs|stage-fsm" src packages` → chỉ còn đường đọc dữ liệu cũ.
5. Suite Node + Rust → commit → merge nhánh plan.

## Success Criteria

- [ ] Work không có `stage`; mọi consumer state đọc Workflow run; dữ liệu cũ đọc đúng (test từ `state.json` cũ).
- [ ] Rust xanh với version mới.

## Risk Assessment

- Quy mô lớn → phase 1 tách thêm nếu cần. Tín hiệu kẹt: test Work đỏ hàng loạt không thu hẹp được sau 1 ngày → dừng, báo owner.
