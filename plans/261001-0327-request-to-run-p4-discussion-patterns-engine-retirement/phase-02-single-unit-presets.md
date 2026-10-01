---
phase: 2
title: "Preset cho dạng một-unit"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Preset cho dạng một-unit

## Overview

Biểu diễn 5 file protocol "một unit" thành **preset có tên** của Pattern cộng tác: `consult` (solo), `research-fan-out` (panel n=3 + tổng hợp), `research-fan-out-gated` (+ cổng lộ trước tổng hợp), `rfc` (reviewed với N red-team, 1 vòng). Conformance test so với hành vi engine.

## Requirements

- Functional:
  - Preset khai ở **một nơi**: `src/runner/execution/patterns/presets.mjs` (P1); tham số: vai, n, vòng, cổng.
  - Cổng lộ (gated): kết quả thành viên panel chỉ đưa vào `inputs` của bước tổng hợp sau cổng; thành viên không thấy nhau (context sạch, `independentOf`).
  - Conformance: cùng câu hỏi qua engine và preset → cùng số vai, cùng ràng buộc độc lập, kết quả tới trạng thái cuối.
  - Skill/doc đang gọi `declared-consult`/`independent-research-*`/rfc protocol → gọi preset (chỉ các tham chiếu trong phạm vi file phase này sở hữu; `fgos-panel` thuộc phase 5).
- Non-functional: không đụng engine.

## Related Code Files

- Modify: `src/runner/execution/patterns/presets.mjs`, test conformance `test/runner/execution/presets-conformance.test.mjs`
- Modify: skill/doc tham chiếu (ngoài `fgos-panel`, `fgos-group-thinking`, `fgos-architecture-panel`)

## Implementation Steps

1. Test conformance trước (engine vs preset, executor giả).
2. Khai 4 preset; sửa tham chiếu.
3. Commit → merge nhánh plan.

## Success Criteria

- [ ] 4 preset + conformance xanh; panel thành viên không thấy nhau (test).

## Risk Assessment

- Hành vi engine có chi tiết preset không có (vd specialist slot) → ghi khác biệt; owner quyết nếu là chức năng thật cần giữ.
