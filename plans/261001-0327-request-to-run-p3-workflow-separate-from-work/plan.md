---
title: "P3 Workflow tách khỏi Work: một Workflow run tuần tự bước + cổng người"
description: "Đóng mối authority 'tuần tự bước + cổng người' ở L3: Workflow (định nghĩa domain) + Workflow run (store JSONL) + một runner; Work chỉ còn bản ghi/board/lifecycle và tham chiếu Workflow run; plan nhiều phase chạy như Workflow run; dispatch hết import Work."
status: pending
priority: P1
effort: "~9–11d"
tags: [workflow, work, sequencing, human-gate, boundary]
created: 2026-10-01
blockedBy: [261001-0327-request-to-run-p1-execution-core]
blocks: [261001-0327-request-to-run-p4-discussion-patterns-engine-retirement]
---

# P3 Workflow tách khỏi Work

## Overview

Hôm nay "tuần tự các bước" có 3 chủ: stage FSM + `loop.mjs` (L3), pha/DAG của engine (L4), skill dẫn vòng lặp bằng prose (L2) — A2. Và dispatch (L5) đọc thẳng workflow/stage của Work — A4. P3 tách **Workflow** ra khỏi Work engine thành lớp độc lập: **Workflow** (định nghĩa theo domain, `domains/<d>/workflows/*.yaml`) + **Workflow run** (trạng thái một lần chạy, store JSONL) + **một runner** (tuần tự bước, park ở cổng người, gom câu hỏi, bước không phụ thuộc vẫn chạy). Mỗi bước sinh Unit → `fgos run` (P1). Work chỉ còn bản ghi yêu cầu/board/status lifecycle và **tham chiếu** Workflow run. Plan AgentKit nhiều phase = Workflow run dịch từ plan. Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

## Mối authority phải đóng

| Mối | Chủ duy nhất sau P3 |
|---|---|
| "tuần tự bước + cổng người" (domain workflow, plan nhiều phase) | Workflow runner (`src/workflow/**`) |
| "Work là gì" | bản ghi yêu cầu + board + status lifecycle; `stage` không còn là field của Work |
| L5 không phụ thuộc L3 | `src/runner/dispatch/**` không import `src/state/workflow-stage-graphs.mjs` hay state Work (guard) |
| định dạng Workflow | YAML domain (`domains/<d>/workflows/*.yaml`); xoá bản chiếu profile `Workflow` của vỏ `FlowDefinition` + `workflow-adapter.mjs` |

## Quyết định nguồn

synthesis: quyết định "Workflow tách khỏi Work" (§6, owner 22:38), "AgentKit plan và Workflow" + (b) quyền sở hữu `plan.md` (§6, 22:52), hình chạy tổng thể (22:45), Q7, A2/A4 + điều chỉnh 1 (§7d), C1 (Work là bản ghi). Một runner duy nhất: rút phần tuần tự stage khỏi `loop.mjs`; không tạo sequencer thứ hai (fable E1).

## Hợp đồng

```yaml
# Workflow (domains/<d>/workflows/<name>.yaml) — định nghĩa, dùng lại
id: coding/feature
steps:
  - id: discovery
    units: [{ template: { capability: coding:discover, pattern: solo, taskSpec: judge-ambiguity } }]
  - id: exploring
    dependsOn: [discovery]
    units: [ … ]
    gate: { kind: human, when: "unit outcome needs-human" }   # cổng người
  - id: approve
    gate: { kind: human }
# Workflow run (.fgos/workflow-runs/<id>/events.jsonl) — trạng thái
{ type: started|step-started|unit-result|parked|answered|step-done|finished, … }
# Work item ── workflowRunId ──► Workflow run (tuỳ chọn)
```

`taskSpec` (hướng dẫn theo domain) do **Workflow layer** resolve thành nội dung/đường dẫn trong `inputs` của Unit — dispatch không còn tự tra (`resolveTaskSpecPath` rời L5 — A4).

## Phases và song song

| # | Phase | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | P1 merge + ca 1 | A | plan |
| 2 | [Workflow + Workflow run store + runner](./phase-02-workflow-definition-run-store.md) | 1 | B | `src/workflow/**` (mới), `src/setup/registrations.mjs` (mục store mới) |
| 3 | [`coding/feature` thành Workflow; stage rời Work](./phase-03-coding-feature-as-workflow.md) | 2 | **C** | `src/state/**`, `src/verbs/state/**`, `src/intake/**`, `src/runner/loop.mjs`, `src/runner/claim-port.mjs`, `src/runner/work-compat.mjs`, `src/runner/prompt-templates*`, `domains/coding/workflows/**`, `domains/coding/registry.yaml`, skill coding + `/fgOS:discover|plan|*-loop|*-next`, `packages/work-state/rust`, `herdr-plugin` (phần stage) |
| 4 | [Plan nhiều phase = Workflow run](./phase-04-plan-as-workflow-run.md) | 2 | **C** | `src/workflow/plan-source.mjs` (mới), `core/skills/fgos-run/` (chỉ phần "nhiều phase") |
| 5 | [Cắt dispatch khỏi Work](./phase-05-cut-dispatch-work-imports.md) | 3 | D | `src/runner/dispatch/operation-choice.mjs`, `assignment-runner.mjs`, `assignment.mjs`, `cli.mjs`, `config.mjs` (chỉ import L3) |
| 6 | [Smoke marketing + dọn + boundary](./phase-06-marketing-smoke-cleanup-boundary.md) | 3, 4, 5 | E | `domains/marketing/**` (Workflow mẫu), `src/runner/definitions/workflow-adapter.mjs` (xoá), profile `Workflow` trong `src/runner/definitions/schema.mjs`, docs, CHANGELOG |

Sóng C: 3 ∥ 4 (khác file; 4 chỉ thêm module mới + phần "nhiều phase" của skill driver). **Song song với P2**: P3 không đụng file P2 sở hữu (track `plan.md`); điểm chạm: skill `fgos-run` — P2 sở hữu phần "một phase", P3 phase 4 thêm phần "nhiều phase" sau khi P2 phase 3 merge (nếu P2 chưa xong, P3 phase 4 đặt logic trong `src/workflow/plan-source.mjs` và chỉ nối skill khi P2 xong).

## Success Criteria

- [ ] Một runner duy nhất cho mọi chuỗi bước (domain workflow, plan nhiều phase); `loop.mjs` không còn tuần tự stage.
- [ ] Work không có field `stage`; board/gateway hiển thị bước từ Workflow run.
- [ ] `rg "workflow-stage-graphs|state/work|state/store" src/runner/dispatch` rỗng; guard test.
- [ ] Workflow marketing có cổng người chạy headless tới cổng, park, trả lời, chạy tiếp (G4b).
- [ ] Xoá profile `Workflow` + `workflow-adapter.mjs`; spec + boundary + CHANGELOG; full `npm test`; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Phase 3 quá lớn (32 file import `workflow-stage-graphs`, 24 file đọc `item.stage`, Rust, gateway, ~20 skill) | phase 3 vượt 2× effort | phase 1 tách phase 3 thành 3a (runtime + state) / 3b (skill + surface) **trước khi bắt đầu** — vẫn single path trong mỗi sub-phase |
| Dữ liệu Work cũ (event có `stage`) | replay đọc sai | đường đọc duy nhất map `stage` cũ → Workflow run ở một chỗ (như T D12 làm với `tier`); `viewSchemaVersion` |
| Runner thành engine thứ hai | runner tự làm vòng lặp review | runner chỉ tuần tự **bước**; vòng lặp trong một Unit là Pattern cộng tác (P1) |
| Project khác đang chạy Work với stage | lệnh `discover/plan` đổi | CHANGELOG + lỗi có hướng dẫn; không alias (single user) |

## Câu hỏi mở

1. Lệnh người dùng cho bước Workflow: giữ verb `fgos discover/plan` như bí danh của "chạy bước X của Workflow run" hay thay bằng `fgos workflow step <run> <step>`? (đề xuất: verb chung `fgos workflow …`; xoá verb theo stage — một đường).
2. Status `awaiting-approval` của Work và cổng người của Workflow: gộp (cổng `approve` cuối Workflow ↔ status Work) hay để Work tự quản? (đề xuất: Work status phản chiếu cổng cuối, không tự quản cổng.)

<!-- slug: request-to-run-p3-workflow-separate-from-work -->
