---
phase: 6
title: "Đo tác động bằng Observe"
status: pending
priority: P1
effort: "0.5d"
dependencies: [5]
---

# Phase 6: Đo trước/sau bằng Observe (sau khi merge)

## Overview
Chạy so sánh trước/sau bằng Observe. Đây là ca đầu tiên dùng Observe để đánh giá một thay đổi. Phase này **chạy sau khi branch đã merge về `main`**, vì "sau" cần dữ liệu thật từ code mới. Nó chỉ đo và viết báo cáo, không sửa code dispatch.

## Requirements
- Source Observe đọc v3 và `usage` đã xong ở phase 5 (trước merge).
- **#3 (review pass vòng đầu):** định nghĩa lại trước khi bỏ `estimate`. <!-- Red Team #11 -->
  - Công thức: trong mỗi binding review, run review **đầu tiên** (theo `assignment` + `runId` nhỏ nhất, hoặc theo round của session) có `category === 'ok'`.
  - Nếu RunResult hoặc event không cho xác định "vòng đầu" thì **giữ** cờ `estimate` và ghi lý do.
- **So sánh cùng định nghĩa:** <!-- Red Team #11 -->
  - **trước**: tính lại trên dữ liệu trước merge bằng **cùng** `deriveOutcome`/`deriveLegacyOutcome`, không dùng con số F4 cũ (khoảng 90% `unclassified`). Baseline JSON của Observe (M4/F6) chỉ dùng để đối chiếu, và ghi rõ nó khác định nghĩa;
  - **sau**: `metrics harness --since <ngày merge>`, sau ít nhất 1 tuần hoặc 50 run.
- Báo cáo `plans/260929-1703-runresult-classification-single-path/reports/impact.md` gồm: #3, #4 theo executor/adapter, số revise mỗi session, và bất thường nếu có.

## Success Criteria
- [ ] "Trước" và "sau" dùng cùng một luật phân nhóm (ghi trong báo cáo).
- [ ] Có báo cáo trước/sau.

## Risk Assessment
- **Dữ liệu sau thay đổi quá ít để kết luận.** Báo cáo ghi rõ n. Chưa đủ n thì kết luận là "chưa đủ dữ liệu", không suy diễn.
- **Nhầm cải thiện do đổi định nghĩa với cải thiện do đổi hành vi.** Đã chặn bằng cách tính lại "trước" với cùng luật.
