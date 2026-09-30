---
phase: 1
title: "Đo tác động bằng Observe"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Đo trước/sau bằng Observe (sau khi merge)

## Overview
Chạy so sánh trước/sau bằng Observe sau khi toàn bộ code RunResult classification (Phase 1–5 của plan `260929-1703-runresult-classification-single-path`) đã merge vào `main`. Đây là ca đầu tiên dùng Observe để đánh giá một thay đổi. Phase này chạy sau khi code mới đã tích luỹ đủ dữ liệu thật trên `main`. Nó chỉ đo và viết báo cáo, không sửa code dispatch.

## Requirements
- Source Observe đọc v3 và `usage` đã xong ở phase 5 (trước merge) và đã active trên máy.
- **#3 (review pass vòng đầu):** định nghĩa lại trước khi bỏ `estimate`.
  - Công thức: trong mỗi binding review, run review **đầu tiên** (theo `assignment` + `runId` nhỏ nhất, hoặc theo round của session) có `category === 'ok'`.
  - Nếu RunResult hoặc event không cho xác định "vòng đầu" thì **giữ** cờ `estimate` và ghi lý do.
- **So sánh cùng định nghĩa:**
  - **trước**: tính lại trên dữ liệu trước merge bằng **cùng** `deriveOutcome`/`deriveLegacyOutcome`, không dùng con số F4 cũ (khoảng 90% `unclassified`). Baseline JSON của Observe (M4/F6) chỉ dùng để đối chiếu, và ghi rõ nó khác định nghĩa;
  - **sau**: `metrics harness --since 2026-09-29`, sau ít nhất 1 tuần hoặc 50 run.
- **Hai chỉ số phụ (đầu vào phase 2, không suy diễn):**
  - **Lặp fail `infra` trên cùng assignment (cho câu hỏi ngưỡng P1).** Phân bố số lần `category === 'infra'` trên **cùng một assignment**: bucket 1, 2, ≥3, theo executor/adapter.
    - Nguồn Observe dự kiến: observation `run.settled` của source `run-result` (`packages/run-result/rust`), attrs `assignmentId`, `category` (hoặc `classification.outcome.category`), `executor`, `adapter`.
    - CLI `fgos metrics harness` / `fgos metrics runs --by executor|adapter` hiện chỉ bucket tổng theo executor/adapter/role, **chưa cắt phân bố lặp theo assignment**. Đây không phải khoảng trống nguồn: phase 1 tự nhóm từ cùng observation `run.settled`. Nếu khi chạy không lấy được từng observation (chỉ có bucket tổng) thì ghi rõ khoảng trống cắt số liệu, không bịa phân bố.
  - **Session chạm `aggregateBounds.maxRounds` (cho P3').** Số session coordination bị chặn vì chạm `aggregateBounds.maxRounds`, trên tổng số session.
    - Nguồn Observe dự kiến: source `coordination` (`packages/coordination-state/rust`) — hiện emit `session.opened`, `session.assignment`, `session.result_linked`, `session.disposition`, `session.closed`.
    - **Khoảng trống:** Observe **chưa đọc được** lần chạm cap. `session-opened` payload chỉ có `coordinationId` + `provenanceRoot` (không có `aggregateBounds`). Source chỉ lấy `status`/`completedAt` từ `session.json`, không lấy `aggregateBounds.maxRounds`. Khi cap bị chạm, `createSessionAssignment` ném `CoordinationError('validation')` và **không ghi event** riêng. Không suy từ heuristic (ví dụ đếm assignment = 10). `reports/impact.md` ghi "không đo được bằng Observe hiện tại".
- Báo cáo `plans/260930-0335-measure-runresult-classification-impact/reports/impact.md` gồm: #3, #4 theo executor/adapter, số revise mỗi session, usage, phân bố fail `infra` lặp trên cùng assignment (1 / 2 / ≥3, theo executor/adapter) kèm nguồn Observe, số session chạm `aggregateBounds.maxRounds` trên tổng session kèm nguồn Observe (hoặc khoảng trống), và bất thường nếu có.

## Success Criteria
- [ ] "Trước" và "sau" dùng cùng một luật phân nhóm (ghi trong báo cáo).
- [ ] Có báo cáo trước/sau tại `reports/impact.md`.
- [ ] Báo cáo có hai chỉ số phụ (phân bố lặp `infra`; tỷ lệ session chạm `maxRounds`) hoặc ghi rõ khoảng trống Observe, không bịa số.

## Risk Assessment
- **Dữ liệu sau thay đổi quá ít để kết luận.** Báo cáo ghi rõ n. Chưa đủ n thì kết luận là "chưa đủ dữ liệu", không suy diễn.
- **Nhầm cải thiện do đổi định nghĩa với cải thiện do đổi hành vi.** Đã chặn bằng cách tính lại "trước" với cùng luật.
- **Khoảng trống P3'.** Thiếu số session chạm `maxRounds` thì phase 2 không tự loại/giữ P3'; hỏi owner.
