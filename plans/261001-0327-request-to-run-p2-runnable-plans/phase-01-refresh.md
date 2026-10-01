---
phase: 1
title: "Làm tươi"
status: done
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Làm tươi

## Overview

Khớp plan với `main` sau P1 và P3a: hợp đồng Unit/`fgos run` thật, API Workflow runner (start/answer, Workflow từ Unit[], dịch plan → Workflow, bước tích hợp), kết quả nghiệm thu ca 1, con trỏ code của skill/doctrine/verb sẽ sửa; đếm **đủ** consumer của `fgos capability match` (~32 file), DemandFacts, skill bị xoá.

## Requirements

- Functional: mọi con trỏ trong phase 2–5 kiểm lại; điều chỉnh theo báo cáo ca 1 của P1 (`plans/261001-0327-request-to-run-p1-execution-core/reports/acceptance-case-1.md`).
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `phase-*.md` của plan này.

## Implementation Steps

1. Cổng: P1 và P3a (P3 phase 2) đã lên `main`.
2. Nhánh `plan/261001-request-to-run-p2` + worktree; symlink; GitNexus analyze.
3. Scout: `src/report/capability-plan-lint.mjs` (đọc `plan.md` chỉ; luật ghim hạ tầng ~13-22); `src/runner/capability-match.mjs` + caller (`bin/fgos.mjs` verb `capability`); `core/skills/_shared/*` nhắc DemandFacts/Q0–Q2; `domains/coding/skills/fgos-code-change/SKILL.md` (plan mode, gate `code:implement|refactor`); `fgos-code-panel`, `fgos-plan-loop` (deprecated); mọi chỗ gọi `fgos capability match` (gồm `core/skills/fgos-panel/SKILL.md:71`, `core/skills/fgos-architecture-panel/SKILL.md:81`); (`decide` + hook `scripts/dispatch-decide-hook.mjs` đã chuyển ở P1 phase 7 — chỉ kiểm lại).
4. Đọc báo cáo ca 1 P1: có điều gì đổi hợp đồng Unit/`fgos run` không → cập nhật phase 2–3.
5. Commit plan.

## Success Criteria

- [x] Bảng con trỏ cũ→mới trong `plan.md`; danh sách caller DemandFacts/matcher đầy đủ.

## Risk Assessment

- P1 đổi hợp đồng Unit → cập nhật phase 2, 3 trước khi bắt đầu.
