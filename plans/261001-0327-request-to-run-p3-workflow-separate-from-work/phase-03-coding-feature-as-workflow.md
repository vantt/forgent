---
phase: 3
title: "coding/feature thành Workflow; stage rời Work"
status: pending
priority: P1
effort: "4–5d (có thể tách 3a/3b ở phase 1)"
dependencies: [2]
---

# Phase 3: `coding/feature` thành Workflow; `stage` rời Work

## Overview

Chuyển lifecycle coding (discovery → exploring → planning → executing …) từ stage của Work sang các bước của Workflow `coding/feature`; Work item tham chiếu `workflowRunId`; xoá `stage` khỏi Work (state, replay, pool, frontier, Rust, gateway, web); `loop.mjs` không còn tuần tự stage; skill/verb theo stage chuyển sang "chạy bước của Workflow run". Single path: xoá cái cũ trong cùng phase.

## Requirements

- Functional:
  - `domains/coding/workflows/feature.yaml` viết lại theo schema Workflow (phase 2): mỗi stage → step; operation → unit template (`taskSpec`, `capability` `coding:*`, `pattern`); `dispatch: human-only` → `gate: human`; bỏ `policy` (không ghim — đã làm ở P1 phase 7).
  - `registry.yaml` của domain: roleGraph/edges chỉ giữ phần Workflow dùng; phần thừa xoá.
  - Work (`src/state/work.mjs`, `store.mjs`, `replay.mjs`): bỏ `stage`; thêm `workflowRunId?`; **đường đọc duy nhất** cho dữ liệu cũ: event/snapshot có `stage` → map sang Workflow run (một chỗ, có `viewSchemaVersion`), không alias.
  - Pool/frontier/triage/plan-pool/discover-pool/handoff… đọc bước hiện tại từ Workflow run thay vì `item.stage`.
  - `loop.mjs`: bỏ tuần tự stage; Work runner (nếu còn) chỉ gọi Workflow runner `advance`.
  - Verb/skill: `fgos discover/plan` và `/fgOS:discover|plan|discover-loop|plan-loop|*-next`, `fgos-coding-driving`, `fgos-routing` → dùng Workflow run (theo quyết định câu hỏi mở 1); xoá bản cũ; `npm run build:skills`.
  - Rust `packages/work-state` + `herdr-plugin` gateway/web: hiển thị bước từ Workflow run; khoá `stage` trong contract JSON → lỗi 4xx có hướng dẫn.
  - Status lifecycle Work (`status-fsm.mjs`) giữ nguyên trừ chỗ phụ thuộc stage (theo quyết định câu hỏi mở 2).
- Non-functional: test Work + Rust + gateway xanh; dữ liệu cũ đọc đúng.

## Related Code Files

- Modify: `src/state/**` (work, store, replay, stage-fsm (xoá hoặc thu về Workflow), status-fsm, frontier, *-pool, handoff, impact, graph-*), `src/verbs/state/**`, `src/intake/**`, `src/runner/loop.mjs`, `src/runner/claim-port.mjs`, `src/runner/work-compat.mjs`, `src/runner/prompt-templates*`, `domains/coding/workflows/feature.yaml`, `domains/coding/registry.yaml`, skill coding + plugin wrapper (qua build), `packages/work-state/rust/src/**`, `herdr-plugin/src/gateway.rs`, `herdr-plugin/web/src/**`
- Delete: `src/state/workflow-stage-graphs.mjs` (logic còn cần chuyển vào `src/workflow/definition.mjs`), `src/state/stage-fsm.mjs` (nếu thành thừa)

## Implementation Steps

1. GitNexus `impact` cho `resolveWorkflow`, `operationsForStage`, `validateWork`, `rebuildView`, `pickNextPlanItem`… (dự kiến CRITICAL → báo owner).
2. Test trước: item cũ có `stage` đọc ra Workflow run đúng bước; item mới tạo Workflow run khi bắt đầu; `discover` một item chạy bước discovery qua runner; gateway trả bước hiện tại; snapshot cũ fold lại khi lệch version.
3. Viết lại `feature.yaml`; chuyển state; chuyển verb/skill; Rust/gateway/web.
4. Xoá cái cũ; `rg "\.stage\b|workflow-stage-graphs|stage-fsm" src bin core domains packages herdr-plugin` → chỉ còn đường đọc dữ liệu cũ.
5. Full suite (Node + Rust) → commit → merge nhánh plan.

## Success Criteria

- [ ] Work không có `stage`; mọi consumer đọc Workflow run.
- [ ] Dữ liệu Work cũ đọc đúng (test từ `state.json` hình dạng cũ).
- [ ] Skill/verb chạy bước qua runner; build skills sạch.

## Risk Assessment

- Quy mô lớn → tách 3a/3b ở phase 1. Tín hiệu kẹt: test Work đỏ hàng loạt không thu hẹp được sau 1 ngày → dừng, báo owner, cân nhắc chuyển tiếp dần trong cùng phase (không để hai đường lâu dài).
- Gateway/web dùng ở project khác → CHANGELOG + lỗi hướng dẫn.
