---
phase: 3
title: "Bỏ quyền git + xoá ngoại lệ 0051"
status: pending
priority: P2
effort: "0.25d"
dependencies: [2]
---

# Phase 3: Bỏ quyền git + xoá ngoại lệ 0051

## Overview

Không còn đường nào cần worker tự commit → bỏ `Bash(git add|commit)` ở mọi nơi; ngoại lệ 0051 được supersede.

## Requirements

- Functional:
  - Bỏ `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(rtk git add:*)`, `Bash(rtk git commit:*)` khỏi: mặc định `src/runner/dispatch/config.mjs`, `.fgos/config.json`, `core/skills/fgos-architecture-panel/SKILL.md`, `docs/specs/runner.md`, và mọi chỗ phase 1 tìm được. `--allowedTools` rỗng → bỏ cờ.
  - `docs/specs/runner.md`: thêm quyết định mới supersede **0051** ("worker không bao giờ có quyền git; runner commit trên mọi đường") — không sửa 0051 tại chỗ; chạy `npm run decision-index` nếu repo yêu cầu.
  - Doctor: cảnh báo invocation còn cấp `Bash(git add|commit)` (đăng ký vào `src/setup/registrations.mjs` + Data Dictionary trong `docs/specs/distribution.md`).
  - `fgos setup` config-merge không còn ghi quyền git.
  - CHANGELOG `[Unreleased]`.
- Non-functional: `npm run build:skills` nếu sửa `core/skills`.

## Related Code Files

- Modify: `src/runner/dispatch/config.mjs`, `.fgos/config.json`, `core/skills/fgos-architecture-panel/SKILL.md`, render targets, `docs/specs/runner.md`, `docs/specs/distribution.md`, `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `CHANGELOG.md`
- Tests: `test/setup/*.test.mjs`, `test/runner/dispatch-*config*.test.mjs`, `test/skills/fgos-mirror.test.mjs`, `test/scripts/check-decision-*.test.mjs`

## Implementation Steps

1. Test trước: doctor cảnh báo; config mặc định không có quyền git.
2. Sửa; build skills; test liên quan xanh; commit.

## Success Criteria

- [ ] `rg -n "Bash\(git (add|commit)" src core domains docs/specs .fgos/config.json` rỗng (trừ lịch sử/CHANGELOG).
- [ ] Doctor test xanh; quyết định mới supersede 0051.

## Risk Assessment

- Project khác đã có config cấp quyền git → doctor cảnh báo (không tự xoá config người dùng); CHANGELOG hướng dẫn.
