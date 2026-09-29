---
phase: 5
title: "Đo tác động bằng Observe"
status: pending
priority: P1
effort: "0.5d"
dependencies: [3, 4]
---

# Phase 5: Cập nhật source Observe và đo trước/sau

## Overview
Source `run-result` của Observe đọc classification (v3) và `usage`, rồi chạy so sánh trước/sau. Đây là ca đầu tiên dùng Observe để đánh giá một thay đổi.

## Requirements
- `packages/run-result/rust`: phần đọc v3 đã làm ở merge B của phase 3; phase này chỉ thêm `usage`. <!-- Updated: Validation Session 3 - khớp Observe sau red-team -->
  - đọc `usage` (`totalTokens` khi không có input/output);
  - #4 đọc `classification.outcome.category` (đã làm ở phase 3); record cũ đi qua luật đóng băng.
- Scorecard:
  - #4 theo `category`;
  - `tokens` cộng thêm `usage` cho executor không phải Claude.
- **#3 (review pass vòng đầu):** định nghĩa lại trước khi bỏ `estimate`. <!-- Red Team #11 -->
  - Công thức: trong mỗi binding review, run review **đầu tiên** (theo `assignment` + `runId` nhỏ nhất, hoặc theo round của session) có `category === 'ok'`.
  - Nếu RunResult hoặc event không cho xác định "vòng đầu" thì **giữ** cờ `estimate` và ghi lý do.
- **So sánh cùng định nghĩa:** <!-- Red Team #11 -->
  - **trước**: tính lại trên dữ liệu trước merge bằng **cùng** `deriveOutcome`/`deriveLegacyOutcome`, không dùng con số F4 cũ (khoảng 90% `unclassified`). Baseline JSON của Observe (M4/F6) chỉ dùng để đối chiếu, và ghi rõ nó khác định nghĩa;
  - **sau**: `metrics harness --since <ngày merge B>`, sau ít nhất 1 tuần hoặc 50 run.
- Báo cáo `plans/260929-1703-runresult-classification-single-path/reports/impact.md` gồm: #3, #4 theo executor/adapter, số revise mỗi session, và bất thường nếu có.

## Success Criteria
- [ ] Source Observe dùng chung fixture `legacy-derivation.json` với Node.
- [ ] "Trước" và "sau" dùng cùng một luật phân nhóm (ghi trong báo cáo).
- [ ] Có báo cáo trước/sau.

## Risk Assessment
- **Dữ liệu sau thay đổi quá ít để kết luận.** Báo cáo ghi rõ n. Chưa đủ n thì kết luận là "chưa đủ dữ liệu", không suy diễn.
- **Nhầm cải thiện do đổi định nghĩa với cải thiện do đổi hành vi.** Đã chặn bằng cách tính lại "trước" với cùng luật.
