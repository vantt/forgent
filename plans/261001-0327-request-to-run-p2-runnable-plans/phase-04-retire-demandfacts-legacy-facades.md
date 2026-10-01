---
phase: 4
title: "Bỏ DemandFacts + facade cũ"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 4: Bỏ DemandFacts + facade cũ

## Overview

Xoá lớp "DemandFacts (8 field) → matcher → `capability` + `form`" (D1); viết lại doctrine Q0–Q2 thành hướng dẫn ngắn "hiểu → viết Unit → `fgos-run`" (L2 chỉ còn phán đoán, không còn quy tắc chọn người/cơ chế); xoá skill deprecated. (`dispatch decide` + hook + AGENTS.md § Dispatch đã chuyển sang `bind()` ở P1 phase 7 — phase này chỉ sửa phần doctrine còn nhắc DemandFacts.)

## Requirements

- Functional:
  - Xoá `src/runner/capability-match.mjs`, verb `fgos capability match` (giữ `capability` subcommand khác nếu có caller thật — kiểm phase 1), `serves` trong catalog nếu chỉ phục vụ matcher.
  - Doctrine mới (thay `core/skills/_shared/capability-matching.md`, `planning-capability-awareness.md`, cập nhật `capability-catalog.md`, `executor-dispatch-fallback.md`): (1) hiểu yêu cầu; (2) viết Unit (`capability` `domain:verb`, `rigor`, `writes`, `dependsOn`, `pattern?`); (3) gọi driver/`fgos run`. Không có bảng chọn executor trong prose.
  - Sửa **2 dòng** gọi `capability match` ở `core/skills/fgos-panel/SKILL.md:71` và `core/skills/fgos-architecture-panel/SKILL.md:81` (file thuộc P4 nhưng phải sửa cùng lúc xoá verb để không gãy từ P2 tới P4) — thay bằng tra khoá config `domain:verb`.
  - Xoá `core/skills/fgos-plan-loop/`, `domains/coding/skills/fgos-code-panel/`, `core/skills/fgos-capability-dispatching/` (nếu chỉ phục vụ DemandFacts — kiểm phase 1); `npm run build:skills`.
- Non-functional: không đụng file của phase 2, 3.

## Related Code Files

- Delete: `src/runner/capability-match.mjs`, `core/skills/fgos-plan-loop/`, `domains/coding/skills/fgos-code-panel/`, (có điều kiện) `core/skills/fgos-capability-dispatching/`
- Modify: `bin/fgos.mjs` + `src/cli/command-registry.mjs` (mục `capability`), `core/skills/_shared/*.md`, `core/skills/fgos-panel/SKILL.md` (1 dòng), `core/skills/fgos-architecture-panel/SKILL.md` (1 dòng), `src/setup/registrations.mjs` (check `capability-serves-valid` nếu thành thừa)
- Tests: test của matcher (xoá), test doctrine (`test/setup/capability-catalog-doctrine.test.mjs`)

## Implementation Steps

1. GitNexus `impact` `matchCapability`, `deriveForm`; đếm caller (phase 1: ~32 file).
2. Xoá + viết lại doctrine; sửa 2 skill P4.
3. Suite setup + skill → commit → merge nhánh plan.

## Success Criteria

- [ ] `rg "DemandFacts|matchCapability|deriveForm|fgos-plan-loop|fgos-code-panel|capability match" src bin core domains AGENTS.md` rỗng (trừ lịch sử/CHANGELOG).

## Risk Assessment

- Doc/skill khác (ngoài repo, project dùng fgOS) gọi `fgos capability match` → CHANGELOG ghi bỏ; lỗi có hướng dẫn.
