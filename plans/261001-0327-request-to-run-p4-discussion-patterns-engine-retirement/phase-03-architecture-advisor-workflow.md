---
phase: 3
title: "Architecture advisor = Workflow (ca nghiệm thu 2)"
status: pending
priority: P1
effort: "2.5d"
dependencies: [1]
---

# Phase 3: Architecture advisor = Workflow (ca 2)

## Overview

Biểu diễn lại architecture advisory panel (9 vai, 6 pha, visibility windows, specialist slot, dialogue reopen) thành **Workflow** `architecture-advisory` trên mô hình gọn; chạy **ca nghiệm thu 2** song song với engine trên cùng câu hỏi kiến trúc thật; rewire skill `fgos-architecture-panel`.

## Requirements

- Functional:
  - `core/workflows/architecture-advisory.yaml` (loader 3 tầng core/domain/project — P3 phase 2): bước `framing` (interpret + investigate, solo), `shaping` (panel 3: system / alternative / constraint; mỗi thành viên chỉ thấy kết quả framing), `critique` (critique + assess-constraints, thấy 3 đề xuất), `synthesis` (synthesize; red-team packet tuỳ tham số — gộp v1/standard theo quyết định câu hỏi mở 1), `explanation`, `dialogue` (cổng người: hỏi lại → revise-synthesis/explanation → close).
  - Visibility theo kết luận phase 1 (`inputs` + context sạch, ± confinement đọc).
  - Specialist: unit tuỳ chọn, kích hoạt khi bước critique/synthesis yêu cầu (outcome `needs-specialist`) — không cần "slot" riêng nếu biểu diễn được bằng bước điều kiện.
  - Vai/persona khoá theo vai nghiệp vụ (Q6); executor theo khẩu vị (phản biện = claude opus — C6).
  - Skill `fgos-architecture-panel`: khởi chạy Workflow thay engine; giữ trải nghiệm hỏi lại (dialogue) của người dùng.
  - **Ca 2**: một câu hỏi kiến trúc thật owner chọn; chạy engine (protocol hiện tại) và Workflow; đo §0 (Lead-active, can thiệp, đúng người, chất lượng: chất lượng khuyến nghị do owner chấm mù A/B, tới trạng thái cuối, thời gian).
- Non-functional: báo cáo `reports/acceptance-case-2.md`.

## Related Code Files

- Create: `core/workflows/architecture-advisory.yaml`, `plans/…-p4-…/reports/acceptance-case-2.md`
- Modify: `core/skills/fgos-architecture-panel/` (SKILL + references), wrapper qua `npm run build:skills`

## Implementation Steps

1. Viết Workflow; test cấu trúc (độc lập vòng shaping, inputs đúng từng bước).
2. Rewire skill.
3. Chạy ca 2 (owner chọn câu hỏi; chấm mù) → báo cáo.
4. Không đạt → ghi phần thiếu, bổ sung, chạy lại; vẫn không đạt → owner quyết (Q8).
5. Commit → merge nhánh plan.

## Success Criteria

- [ ] Ca 2 không thua engine ở tiêu chí 1, 2, 4; owner chấm chất lượng ≥ engine.
- [ ] Thành viên shaping không thấy nhau (test + kiểm log).

## Risk Assessment

- Câu hỏi thật tốn thời gian owner → gom chấm A/B vào một lượt; dùng câu hỏi đang cần quyết thật để không phí.
