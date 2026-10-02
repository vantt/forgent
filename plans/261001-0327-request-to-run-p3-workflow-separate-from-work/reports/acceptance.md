# Báo Cáo Nghiệm Thu: Request-to-Run P3 Workflow Tách Khỏi Work

Date: 2026-10-02
Plan: `plans/261001-0327-request-to-run-p3-workflow-separate-from-work/plan.md` (Phase 6)
Status: Accepted

---

## 1. Mục tiêu và Tiêu chí nghiệm thu

Nghiệm thu **P3 Workflow tách khỏi Work**:
1. **P3a — Workflow runner độc lập với Work (`src/workflow/**`)**:
   - Định nghĩa Workflow schema (`src/workflow/definition.mjs`), nạp đa tầng (`src/workflow/loader.mjs`).
   - Event store append-only `.fgos/workflow-runs/<id>/events.jsonl` (`src/workflow/store.mjs`).
   - Lập lịch DAG bước & Unit theo `dependsOn`, quản lý cổng người (`gate: human`) gom câu hỏi thành một bộ (`src/workflow/runner.mjs`).
   - Tích hợp git thuần (`src/workflow/integrate.mjs`), không import `src/state/**`.
   - Dịch plan AgentKit sang Workflow (`src/workflow/plan-source.mjs`).
2. **P3b — Work không còn `stage`**:
   - Work items không còn trường `stage` trong state, thêm `workflowRunId?`.
   - Replay một đường đọc dữ liệu cũ: map các event `stage` cũ sang `workflowStep` mà không làm mất tính tương thích.
   - Rust `packages/work-state/rust` đọc `VIEW_SCHEMA_VERSION` 2 & 3.
   - Cắt hoàn toàn các import `src/state/**` khỏi `src/runner/dispatch/**` và `src/runner/execution/**` (A4 boundary).
   - Xoá writer `dispatch-runs` và các reader cũ.
   - Xoá bỏ profile `Workflow` khỏi `FlowDefinition` và `workflow-adapter.mjs`.

---

## 2. Kết quả kiểm chứng

### Smoke Marketing (G4b)
- **Workflow:** `domains/marketing/workflows/content-publish.yaml`.
- **Luồng:** `brief` (marketing:research, solo) → `draft` (marketing:write, reviewed, persona brand-guardian) → `approval` (gate: human) → `publish` (marketing:publish, solo).
- **Thực thi:** Chạy headless tới cổng người `approval`, park trạng thái, câu hỏi được thu thập đầy đủ; sau khi answer thì chạy tiếp bước `publish`.
- **Kết quả:** Đạt (G4b, G7 qua herdr pane hoặc cli fallback).

### Cắt ghép tầng kiến trúc A4 (L5 không phụ thuộc L3)
- `rg "from '.*state/" src/runner/dispatch src/runner/execution`: **0 matches**.
- `test/architecture.test.mjs`: **Pass 13/13**, bao gồm check A4 boundary guard mới.
- Xoá bỏ `openDispatchRun` và `.fgos/dispatch-runs`.

### Dọn dẹp từ vựng & thành phần cũ
- `workflow-adapter.mjs`: **Đã xoá vĩnh viễn**.
- `validateWorkflowProfile`: **Đã xoá khỏi schema**.
- Doctor check `workflow-flow-definition-projects-cleanly`: **Đã xoá sạch khỏi registrations/checks/distribution.md**.
- `rg "workflow-adapter|validateWorkflowProfile|projectWorkflowToFlowDefinition" src`: **0 matches**.

---

## 3. Kết luận

P3 đã hoàn tất trọn vẹn cả hai mốc P3a và P3b.
Work đã trở về đúng bản chất: bản ghi yêu cầu + board + status lifecycle; toàn bộ tuần tự bước, cổng người và tích hợp thuộc về Workflow runner.
Sẵn sàng merge vào `main`.
