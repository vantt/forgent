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
- Báo cáo `plans/260930-0335-measure-runresult-classification-impact/reports/impact.md` gồm: #3, #4 theo executor/adapter, số revise mỗi session, và bất thường nếu có.

## Success Criteria
- [ ] "Trước" và "sau" dùng cùng một luật phân nhóm (ghi trong báo cáo).
- [ ] Có báo cáo trước/sau tại `reports/impact.md`.

## Risk Assessment
- **Dữ liệu sau thay đổi quá ít để kết luận.** Báo cáo ghi rõ n. Chưa đủ n thì kết luận là "chưa đủ dữ liệu", không suy diễn.
- **Nhầm cải thiện do đổi định nghĩa với cải thiện do đổi hành vi.** Đã chặn bằng cách tính lại "trước" với cùng luật.
