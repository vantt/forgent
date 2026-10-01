---
phase: 4
title: "Plan nhiều phase = Workflow run"
status: pending
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 4: Plan nhiều phase = Workflow run

## Overview

"Chạy phase 5 → 7 của plan X" = một Workflow run **dịch từ plan** (định nghĩa dùng một lần): phase → bước, `blockedBy`/thứ tự → `dependsOn`, authorize → cổng người, Unit của phase (block `- unit:` hoặc Lead viết) → unit của bước. Cùng runner với Workflow domain. fgOS **chỉ đọc** `plan.md` (quyết định (b)); tiến độ chạy nằm trong Workflow run.

## Requirements

- Functional:
  - `src/workflow/plan-source.mjs`: đọc `plan.md` + `phase-*.md` (qua plan-lint của P2 nếu đã có, hoặc parser chung) → Workflow (in-memory, `source: plan:<dir>`).
  - Phase chưa authorize → bước có `gate: human` "authorize phase N"; owner trả lời qua `fgos workflow answer` — fgOS **không** ghi vào `plan.md`.
  - Driver chung (`fgos-run`, P2) nhận "chạy phase A..B" → gọi `fgos workflow start --plan <dir> --phases A..B`.
  - Không ghi trạng thái vào `plan.md`; nếu owner/`ak` cập nhật bảng phase, runner đọc lại ở lần `advance` kế.
- Non-functional: không import `src/state/**`.

## Related Code Files

- Create: `src/workflow/plan-source.mjs`, test với plan fixture nhiều phase
- Modify: `core/skills/fgos-run/SKILL.md` (phần "nhiều phase") — chỉ sau khi P2 phase 3 merge; trước đó chỉ làm module

## Implementation Steps

1. Test trước: plan 3 phase (phase 2 chưa authorize) → chạy phase 1, park ở cổng authorize phase 2, trả lời → chạy tiếp; `plan.md` không đổi byte nào.
2. Viết module; nối verb `workflow start --plan`.
3. Nối skill driver (nếu P2 đã merge).
4. Commit → merge nhánh plan.

## Success Criteria

- [ ] Ca ở bước 1 xanh; checksum `plan.md` không đổi.

## Risk Assessment

- Định dạng plan khác (không AgentKit) → Lead viết Workflow/Unit như prompt tự do; module chỉ hỗ trợ AgentKit + block `- unit:`.
