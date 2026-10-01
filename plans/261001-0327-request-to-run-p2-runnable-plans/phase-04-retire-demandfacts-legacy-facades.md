---
phase: 4
title: "Bỏ DemandFacts + facade cũ; decide qua bind()"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 4: Bỏ DemandFacts + facade cũ; `decide` qua `bind()`

## Overview

Xoá lớp "DemandFacts (8 field) → matcher → `capability` + `form`" (D1); viết lại doctrine Q0–Q2 thành hướng dẫn ngắn "hiểu → viết Unit" (L2 chỉ còn phán đoán, không còn quy tắc chọn người/cơ chế); `dispatch decide` gọi `bind()` để chỉ còn một nơi chọn cơ chế; xoá skill deprecated.

## Requirements

- Functional:
  - Xoá `src/runner/capability-match.mjs`, verb `fgos capability match` (giữ `capability` subcommand khác nếu có caller thật — kiểm phase 1), `serves` trong catalog nếu chỉ phục vụ matcher.
  - Doctrine mới (thay `core/skills/_shared/capability-matching.md`, `planning-capability-awareness.md`, cập nhật `capability-catalog.md`, `executor-dispatch-fallback.md`): (1) hiểu yêu cầu; (2) viết Unit (`capability` `domain:verb`, `rigor`, `writes`, `dependsOn`, `pattern?`); (3) gọi driver/`fgos run`. Không có bảng chọn executor trong prose.
  - `dispatch decide`: tính `mechanism` qua `bind()` (cùng luật inline/in-process/out-of-process); giữ kết quả `unavailable` khi không có candidate và có Lead → nghĩa là inline. Hook PreToolUse giữ hành vi chặn (chỉ thay nguồn).
  - `AGENTS.md` § Dispatch: viết lại cho khớp (decide = `bind()`; `fgos run` là cửa chạy). Đây là doctrine luôn-nạp (L8) — giữ ngắn.
  - Xoá `core/skills/fgos-plan-loop/`, `domains/coding/skills/fgos-code-panel/`, `core/skills/fgos-capability-dispatching/` (nếu chỉ phục vụ DemandFacts — kiểm phase 1); `npm run build:skills`.
- Non-functional: không đụng file của phase 2, 3.

## Related Code Files

- Delete: `src/runner/capability-match.mjs`, `core/skills/fgos-plan-loop/`, `domains/coding/skills/fgos-code-panel/`, (có điều kiện) `core/skills/fgos-capability-dispatching/`
- Modify: `bin/fgos.mjs` + `src/cli/command-registry.mjs` (mục `capability`), `core/skills/_shared/*.md`, `src/verbs/dispatch/**`, hook PreToolUse (vị trí do phase 1 tìm), `AGENTS.md`, `src/setup/registrations.mjs` (check `capability-serves-valid` nếu thành thừa)
- Tests: test của matcher (xoá), `test/verbs/dispatch-decide*.test.mjs`, test doctrine (`test/setup/capability-catalog-doctrine.test.mjs`)

## Implementation Steps

1. GitNexus `impact` `matchCapability`, `deriveForm`, hàm `decide`.
2. Test trước: `decide --for <cap>` trả cùng mechanism như `bind()` cho bảng K1–K6.
3. Xoá + viết lại doctrine + AGENTS.md; build skills.
4. Suite dispatch + setup → commit → merge nhánh plan.

## Success Criteria

- [ ] `rg "DemandFacts|matchCapability|deriveForm|fgos-plan-loop|fgos-code-panel" src bin core domains AGENTS.md` rỗng (trừ lịch sử/CHANGELOG).
- [ ] `decide` và `bind()` cùng kết quả trên bảng ca; hook còn chặn.

## Risk Assessment

- Doc/skill khác (ngoài repo, project dùng fgOS) gọi `fgos capability match` → CHANGELOG ghi bỏ; lỗi có hướng dẫn.
