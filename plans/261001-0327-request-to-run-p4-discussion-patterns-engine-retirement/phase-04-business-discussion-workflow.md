---
phase: 4
title: "Business discussion = Workflow (ca nghiệm thu 3)"
status: done
priority: P2
effort: "1.5d"
dependencies: [3]
---

# Phase 4: Business discussion = Workflow (ca 3)

## Overview

Tạo Workflow `business-discussion` (thảo luận vấn đề business — use case thứ hai owner nêu) trên cùng cách làm đã nghiệm thu ở phase 3; chạy **ca nghiệm thu 3** (cũng là ca G4b cho thảo luận non-code có cổng người).

## Requirements

- Functional:
  - Phase 1 của plan này (hoặc đầu phase 4) **phỏng vấn owner ngắn** về hình dạng mong muốn (vai: ví dụ product, finance, customer, risk; số vòng; đầu ra) — gom một lượt câu hỏi; mặc định đề xuất: framing → panel góc nhìn (3–4 vai, độc lập) → phản biện (red-team) → tổng hợp có ý kiến trái → cổng người hỏi lại.
  - `core/workflows/business-discussion.yaml`; persona vai nghiệp vụ (`core/agents/*.yaml` thêm nếu thiếu, có nội dung).
  - Định tuyến: `fgos-panel` nhận yêu cầu business → Workflow này (phối hợp phase 5 — chỉ thêm một dòng định tuyến, sau khi phase 5 merge).
  - **Ca 3**: một vấn đề business thật owner chọn; so với engine (dạng gần nhất hiện có, vd `declared-consult` hoặc nominal group) hoặc so với baseline "một agent trả lời" nếu không có dạng engine tương đương; chỉ số §0.
- Non-functional: báo cáo `reports/acceptance-case-3.md`.

## Related Code Files

- Create: `core/workflows/business-discussion.yaml`, persona mới nếu cần, báo cáo
- Modify: `core/skills/fgos-panel/` (một dòng định tuyến, sau phase 5)

## Implementation Steps

1. Phỏng vấn ngắn owner (một lượt); chốt hình dạng.
2. Viết Workflow + persona; test cấu trúc.
3. Chạy ca 3 → báo cáo.
4. Commit → merge nhánh plan.

## Success Criteria

- [x] Ca 3 đạt G4b và §0 tiêu chí 1, 2, 4; owner chấm hữu ích.

## Risk Assessment

- Không có dạng engine tương đương để so → so với baseline một agent; ghi rõ trong báo cáo.
