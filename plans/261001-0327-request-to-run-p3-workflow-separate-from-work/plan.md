---
title: "P3 Workflow tách khỏi Work: một Workflow runner (P3a) + Work không còn stage (P3b)"
description: "Đóng mối authority 'tuần tự bước + cổng người + tích hợp': một Workflow runner độc lập với Work (P3a, lên main sớm để P2 dùng); Work chỉ còn bản ghi/board/lifecycle, không còn stage; dispatch hết import Work; xoá dispatch-runs (P3b)."
status: done
priority: P1
effort: "~10–12d"
tags: [workflow, work, sequencing, human-gate, integration, boundary]
created: 2026-10-01
blockedBy: [261001-0327-request-to-run-p1-execution-core]
blocks: [261001-0327-request-to-run-p2-runnable-plans, 261001-0327-request-to-run-p4-discussion-patterns-engine-retirement]
---

# P3 Workflow tách khỏi Work

## Overview

"Tuần tự các bước" hôm nay có 3 chủ (stage FSM + `loop.mjs`; pha/DAG engine; skill dẫn vòng lặp bằng prose — A2), dispatch đọc thẳng workflow/stage của Work (A4), và tích hợp/merge gắn chặt Work (`merge.mjs`, `worktree.mjs` — red-team mục 7). P3 chia hai mốc (Q-C, owner 2026-10-01):

- **P3a (phase 1–2)**: **một Workflow runner** độc lập với Work — định nghĩa Workflow (core + domain), Workflow run (store JSONL), lập lịch bước **và** Unit theo `dependsOn`, cổng người, **bước tích hợp** (helper merge/worktree không phụ thuộc Work), **dịch plan → Workflow**. **Mốc merge `main` riêng** (ngoại lệ có chủ đích với luật "merge main một lần": P3a là tính năng hoàn chỉnh có test, cần lên `main` để P2 dùng).
- **P3b (phase 3–6)**: `coding/feature` thành Workflow; Work bỏ `stage`; skill/verb/herdr/web chuyển; dispatch hết import L3; xoá `dispatch-runs` + reader; smoke marketing (G4b). Chạy **song song với P2**.

Thuộc track [request-to-run](../261001-0327-request-to-run-track/plan.md).

## Mối authority phải đóng

| Mối | Chủ duy nhất sau P3 |
|---|---|
| "tuần tự bước + Unit theo `dependsOn` + cổng người + tích hợp" (domain workflow, plan một/nhiều phase, câu tự do nhiều Unit) | Workflow runner (`src/workflow/**`) |
| "Work là gì" | bản ghi yêu cầu + board + status lifecycle; không có `stage` |
| L5 không phụ thuộc L3 | `src/runner/dispatch/**`, `src/runner/execution/**` không import `src/state/**`, `src/workflow/**` (guard) |
| định dạng Workflow | YAML `core/workflows/*.yaml` + `domains/<d>/workflows/*.yaml` (không tầng project — red-team mục 12); loader **chuyển** từ `protocol-loader.mjs`, không viết mới |

## Quyết định nguồn

synthesis "Workflow tách khỏi Work" (§6), "AgentKit plan và Workflow" + (b), hình chạy tổng thể, Q7, A2/A4, **§7e Q-B (Unit run), Q-C (P3a trước P2; một sequencer), G7**; red-team mục 7, 8, 10, 11, 12, 13, 15.

## Làm tươi (Phase 1 scout kết quả)

| Hạng mục | Số lượng / Vị trí | Ghi chú |
|---|---|---|
| `workflow-stage-graphs` | 32 files trong `src/` | Gồm intake (3), runner loop/claim (4), definitions (2), dispatch (4), state (5), templates (3), setup (2) |
| `.stage` | 26 files trong `src/` | Bản ghi Work hiện mang `stage`, sẽ bỏ ở P3b; P3a tách runner độc lập không đụng |
| Helper tích hợp | `src/runner/worktree.mjs` + `src/runner/merge.mjs` | Tách hàm thuần git sang `src/workflow/integrate.mjs`: `createWorkflowWorktree`, `mergeWorkflowBranch`, `cleanupWorkflowBranch` |
| Loader chuyển | `src/runner/definitions/protocol-loader.mjs` | Chuyển nạp core/domain YAML sang `src/workflow/loader.mjs`, bỏ project tier |
| Thiết kế verb `workflow` | `bin/fgos.mjs` & `command-registry.mjs` | Mở rộng `start \| status \| answer \| resume`; giữ `operations` & `stages` tương thích ngược |
| Store Workflow run | `.fgos/workflow-runs/<id>/events.jsonl` | Append-only, không can thiệp store Work |

### Ranh giới helper tích hợp (`src/workflow/integrate.mjs`):
- Thuần git: nhận `repoRoot`, `branch`, `targetBranch`, `worktreePath`.
- Không import `src/state/**`, không biết `item.id`, không ghi `events.jsonl`.
- Work layer (`merge.mjs`) gọi helper này cho phần git, giữ nguyên FSM/status/event bên trên.

### Thiết kế verb `fgos workflow`:
- `fgos workflow start <id> [--units <file>] [--plan <dir>] [--phases A..B] [--dir <mainRoot>]`
- `fgos workflow status <workflowRunId> [--dir <mainRoot>]`
- `fgos workflow answer <workflowRunId> --step <stepId> --answer <text> [--dir <mainRoot>]`
- `fgos workflow resume <workflowRunId> [--dir <mainRoot>]`
- `fgos workflow operations --stage <stage>` & `fgos workflow stages` (giữ tương thích)

## Hợp đồng

```yaml
# Workflow (core/workflows/*.yaml | domains/<d>/workflows/*.yaml)
id: coding/feature
steps:
  - id: discovery
    units: [{ template: { capability: coding:discover, pattern: solo, taskSpec: judge-ambiguity } }]
  - id: exploring
    dependsOn: [discovery]
    units: [ … ]                    # Unit trong bước có dependsOn riêng — runner lập lịch
  - id: integrate
    kind: integrate                 # bước tích hợp: merge kết quả Unit vào nhánh đích (helper không phụ thuộc Work)
  - id: approve
    gate: { kind: human }
# Workflow run: .fgos/workflow-runs/<id>/events.jsonl  (append-only; .gitignore; đọc/ghi qua --dir <mainRoot>)
# Work item ── workflowRunId ──► Workflow run (tuỳ chọn)
# Snapshot: Workflow + config đọc từ checkout chính/global lúc start (không từ worktree)
```

`taskSpec` resolve ở Workflow layer (containment như P1 phase 2) → `inputs` của Unit; dispatch không tự tra.

## Phases và song song

| # | Phase | Mốc | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|---|
| 1 | [Làm tươi](./phase-01-refresh.md) | P3a | P1 merge | A | plan |
| 2 | [Workflow runner + store + tích hợp + dịch plan](./phase-02-workflow-definition-run-store.md) | **P3a → merge `main`** | 1 | B | `src/workflow/**` (mới), `src/runner/definitions/protocol-loader.mjs` (chuyển phần loader chung), helper tích hợp tách từ `src/runner/merge.mjs`/`worktree.mjs` (chỉ phần không phụ thuộc Work), mục `workflow` trong `bin/fgos.mjs` + `src/cli/command-registry.mjs`, `src/setup/registrations.mjs` (store), `.gitignore` |
| 3 | [Work không còn stage (state + Rust)](./phase-03-coding-feature-as-workflow.md) | P3b | 2 | **C** (∥ P2) | `src/state/**`, `src/verbs/state/**`, `src/intake/**`, `src/runner/loop.mjs`, `claim-port.mjs`, `work-compat.mjs`, `prompt-templates*`, `domains/coding/workflows/**`, `domains/coding/registry.yaml`, `packages/work-state/rust`, contract `domain-entry-stages.json` |
| 4 | [Bề mặt: verb, skill, herdr, web](./phase-04-surfaces-skills-herdr.md) | P3b | 3 | D | verb/skill theo stage (`/fgOS:discover|plan|*-loop|*-next`, `fgos-coding-driving`, `fgos-routing` phần stage), `herdr-plugin/src/**` (gateway, `pick.rs`), `herdr-plugin/web/src/**` |
| 5 | [Cắt dispatch khỏi Work + xoá `dispatch-runs`](./phase-05-cut-dispatch-work-imports.md) | P3b | 3 | D (∥ 4) | `src/runner/dispatch/{operation-choice,assignment-runner,assignment,cli,config}.mjs` (phần L3 + `dispatch-runs`), `src/runner/fanout-batch.mjs`, reader `show-run.mjs`, `visibility-session.mjs`, `runtime-inspection.mjs` |
| 6 | [Smoke marketing + dọn + boundary](./phase-06-marketing-smoke-cleanup-boundary.md) | P3b | 4, 5 | E | `domains/marketing/workflows/**`, xoá `workflow-adapter.mjs` + profile `Workflow`, docs, CHANGELOG |

Sóng D: 4 ∥ 5 (khác file). P2 chạy song song từ sóng C (bảng sở hữu ở track).

## Success Criteria

- [x] P3a: một runner lập lịch bước + Unit theo `dependsOn`, cổng người gom câu hỏi, bước tích hợp không cần Work, dịch plan → Workflow; merge `main`.
- [x] Work không có `stage`; board/gateway/web hiển thị bước từ Workflow run; dữ liệu cũ đọc đúng qua một đường.
- [x] `rg "from '.*state/" src/runner/dispatch src/runner/execution` rỗng; guard; `dispatch-runs` + reader xoá.
- [x] Workflow marketing có cổng người chạy headless (G4b), các vai out-of-process qua pane herdr (G7).
- [x] Xoá `workflow-adapter.mjs` + profile `Workflow`; spec + boundary + CHANGELOG; full `npm test` (Node + Rust); merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Phase 3 vẫn lớn (32 import + 25 `.stage` + 70 test + Rust) | vượt 2× effort | phase 1 đếm lại; tách thêm nếu cần; không để hai đường lâu dài |
| Dữ liệu Work cũ có `stage`; Rust đọc thẳng `state.json` | replay/gateway sai | **tạo mới** version cho view (`viewSchemaVersion` chưa tồn tại — `SCHEMA_VERSION` ở `replay.mjs:47`), một đường đọc map `stage` → Workflow run; Rust kiểm cùng version |
| Gateway detached + binary global ở project khác vẫn ghi `stage` | sự kiện `stage` mới xuất hiện | restart gateway (`fgos gateway stop/start`); doctor cảnh báo binary cũ; đường đọc chấp nhận và map |
| Runner thành engine thứ hai | runner tự làm vòng lặp review | runner chỉ tuần tự **bước/Unit**; vòng lặp trong Unit là Pattern cộng tác (P1) |
| Helper tích hợp kéo theo Work | import `src/state/**` | chỉ tách phần thuần git (merge/worktree); phần gắn Work giữ ở `merge.mjs` cho Work dùng |

## Câu hỏi mở

Không còn. Work `awaiting-approval` **phản chiếu cổng người cuối** của Workflow run — một chỗ giữ "chờ duyệt" (validate 2026-10-01). <!-- Updated: Validation Session 1 -->

<!-- slug: request-to-run-p3-workflow-separate-from-work -->

## Trạng thái thật (2026-10-02, vòng sửa chung)

P3b làm lại thật: Work ghi `workflowStep` từ Workflow (đường đọc `stage` cũ duy nhất ở `replay.mjs`), đồ thị stage chép cứng trong dispatch xoá, dispatch nhận domain/operations qua Assignment và kiểm "operation hợp lệ", guard kiến trúc cấm literal domain/step trong `src/runner/dispatch/**` và `execution/**`. Smoke marketing chạy thật tới gate và hoàn tất: [acceptance](reports/acceptance.md). Concerns ở report đó (herdr transport, tên operation, dọn unit worktree).
