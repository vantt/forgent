---
phase: 1
title: "Làm tươi"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Làm tươi

## Overview

Khớp plan với `main` sau P1: hợp đồng Unit/`fgos run` thật, kết quả nghiệm thu ca 1, con trỏ code của skill/doctrine/verb sẽ sửa.

## Requirements

- Functional: mọi con trỏ trong phase 2–5 kiểm lại; điều chỉnh theo báo cáo ca 1 của P1 (`plans/261001-0327-request-to-run-p1-execution-core/reports/acceptance-case-1.md`).
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `phase-*.md` của plan này.

## Implementation Steps

1. Cổng: P1 đã merge `main`.
2. Nhánh `plan/261001-request-to-run-p2` + worktree; symlink; GitNexus analyze.
3. Scout: `src/report/capability-plan-lint.mjs` (đọc `plan.md` chỉ; luật ghim hạ tầng ~13-22); `src/runner/capability-match.mjs` + caller (`bin/fgos.mjs` verb `capability`); `core/skills/_shared/*` nhắc DemandFacts/Q0–Q2; `domains/coding/skills/fgos-code-change/SKILL.md` (plan mode, gate `code:implement|refactor`); `fgos-code-panel`, `fgos-plan-loop` (deprecated); `src/verbs/dispatch` (`decide`); hook PreToolUse (tìm script thật: `rg -l "dispatch decide" .claude plugins core`); mọi chỗ gọi `fgos capability match`.
4. Đọc báo cáo ca 1 P1: có điều gì đổi hợp đồng Unit/`fgos run` không → cập nhật phase 2–3.
5. Commit plan.

## Success Criteria

- [ ] Bảng con trỏ cũ→mới trong `plan.md`; danh sách caller DemandFacts/matcher đầy đủ.

## Risk Assessment

- P1 đổi hợp đồng Unit → cập nhật phase 2, 3 trước khi bắt đầu.
