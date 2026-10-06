---
phase: 5
title: "Các dạng thảo luận còn lại = Workflow"
status: done
priority: P2
effort: "2d"
dependencies: [1]
---

# Phase 5: Các dạng còn lại = Workflow

## Overview

Biểu diễn lại delphi (chain, feedback-lite), nominal group (chain, lite), group cognition thành Workflow; chuyển `fgos-panel` + `fgos-group-thinking` + Protocol Pack sang định tuyến tới preset/Workflow theo tên; conformance với engine.

## Requirements

- Functional:
  - `core/workflows/delphi.yaml` (biến thể chain/lite bằng tham số), `nominal-group.yaml` (chain/lite), `group-cognition.yaml`: mỗi pha = bước; vòng ẩn danh = `panel` với thành viên độc lập; tổng hợp/feedback = bước solo; "vòng 2 thấy tổng hợp" = `inputs`.
  - `core/protocol-packs/group-thinking.json` → registry các dạng thảo luận (preset + Workflow) theo tên; hoặc xoá nếu `fgos-panel` tra trực tiếp (một nơi — RUL11; chọn ở phase 1).
  - `fgos-panel`: định tuyến yêu cầu tự nhiên tới preset/Workflow (consult, research, rfc, architecture, business, delphi, nominal, group-cognition); `fgos-group-thinking` thành cổng chạy theo tên hoặc gộp vào `fgos-panel` (một skill nếu được).
  - Conformance: mỗi dạng chạy trên mô hình gọn với câu hỏi fixture; so cấu trúc với engine (số vòng, độc lập, ai thấy gì).
- Non-functional: không đụng file của phase 2, 3, 4 (trừ dòng định tuyến business do phase 4 thêm sau).

## Related Code Files

- Create: `core/workflows/{delphi,nominal-group,group-cognition}.yaml`, test conformance
- Modify/Delete: `core/protocol-packs/group-thinking.json`, `src/verbs/coordination/group-thinking-pack.mjs` (chuyển hoặc xoá ở phase 6), `core/skills/fgos-panel/`, `core/skills/fgos-group-thinking/`

## Implementation Steps

1. Test conformance trước.
2. Viết 3 Workflow; chuyển định tuyến; build skills.
3. Commit → merge nhánh plan.

## Success Criteria

- [x] 3 Workflow + conformance xanh; `fgos-panel` định tuyến mọi dạng không cần protocol id.

## Risk Assessment

- Group cognition có cơ chế đặc biệt (cluster-deduplicate, recommend-with-dissent) khó biểu diễn → bước solo với hướng dẫn rõ; nếu không đạt conformance → owner quyết (Q8).
