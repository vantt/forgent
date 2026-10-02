---
phase: 3
title: "Capability mặc định + độc lập synthesizer + dọn worktree"
status: pending
priority: P2
effort: "1d"
dependencies: [1]
---

# Phase 3: Capability mặc định + độc lập synthesizer + dọn worktree

## Overview

Ba việc dở từ vòng sửa, khác file với phase 2 nên chạy song song.

## Requirements

- Functional:
  - **Capability mặc định**: 13 entry `runner.capabilities.{marketing:research|write|publish, architecture:frame|shape|critique|synthesize|explain, business:frame|perspectives|critique|synthesize|plan}` (hiện chỉ trong `.fgos/config.json` chưa commit; bản gốc `.fgos/config.json.pre-acceptance-261002`) → đăng ký vào `fgos setup` config-merge (`src/setup/registrations.mjs`) để project khác cũng có; doctor báo capability mà Workflow core/domain dùng nhưng config không có. `.fgos/config.json` của repo: commit đúng bản setup sinh ra; xoá file `.pre-acceptance-261002`.
  - **Độc lập synthesizer**: `src/runner/execution/patterns/panel.mjs` — synthesizer `independentOf` mọi panelist theo **provider** (cùng cách vòng sửa đã làm cho reviewer/panelist), không theo tên vai.
  - **Dọn worktree**: Workflow run kết thúc (complete/failed/cancelled) → `cleanupWorkflowWorktree` (`src/workflow/integrate.mjs:122`) cho worktree của các Unit đã tích hợp; giữ worktree của Unit failed (để điều tra) và ghi đường dẫn vào event.
- Non-functional: theo Install/setup/doctor gate trong `AGENTS.md`; CHANGELOG `[Unreleased]`.

## Related Code Files

- Modify: `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `docs/specs/distribution.md` (Data Dictionary nếu doctor check mới), `src/runner/execution/patterns/panel.mjs`, `src/workflow/runner.mjs`, `.fgos/config.json`
- Delete: `.fgos/config.json.pre-acceptance-261002`
- Tests: `test/setup/registrations.test.mjs`, `test/setup/checks.test.mjs`, `test/runner/execution/patterns-*.test.mjs`, `test/workflow/*.test.mjs`

## Implementation Steps

1. Test trước: setup trên project trống ghi 13 capability; doctor báo thiếu; synthesizer cùng provider với panelist → bị lọc/đổi; Workflow run complete → worktree Unit pass bị xoá, Unit failed còn.
2. Sửa; regenerate `.fgos/config.json` bằng `fgos setup` (theo memory: so `git diff --stat` trước khi stage).
3. Suite liên quan xanh → commit → merge nhánh plan.

## Success Criteria

- [ ] `fgos setup` + doctor phủ 13 capability; `.fgos/config.json` commit sạch.
- [ ] Synthesizer khác provider panelist (test).
- [ ] Worktree Unit được dọn đúng luật (test).

## Risk Assessment

- Setup ghi đè khẩu vị project đã có → config-merge chỉ thêm key thiếu (luật project đè global hiện có); test.
