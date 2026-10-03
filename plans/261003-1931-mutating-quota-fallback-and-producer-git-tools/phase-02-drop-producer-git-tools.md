---
phase: 2
title: "Bỏ quyền git của producer"
status: pending
priority: P2
effort: "0.15d"
dependencies: []
---

# Phase 2: Bỏ quyền git của producer

## Overview

Runner tự commit nên không invocation nào cần cho agent `git add`/`git commit`.

## Requirements

- Functional:
  - Bỏ `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(rtk git add:*)`, `Bash(rtk git commit:*)` khỏi `allowedTools` ở: mặc định trong `src/runner/dispatch/config.mjs`, `.fgos/config.json` (dòng ~19, ~526, ~566), `core/skills/_shared/coding-worker-contract.md`, `core/skills/fgos-architecture-panel/SKILL.md`, `docs/specs/runner.md`. Nếu `--allowedTools` thành rỗng → bỏ cả cờ.
  - Trước khi bỏ: tìm đường còn dựa vào agent tự commit (`rg -n "git commit" src/runner domains core/skills`, Work runner `src/runner/loop.mjs`). Đường nào còn cần → chuyển sang runner commit (`commit-unit-work.mjs`) hoặc ghi rõ ngoại lệ trong plan + CHANGELOG; không âm thầm giữ.
  - Doctor (nếu đã có check allowedTools/executor profile): cảnh báo invocation producer còn cấp git add/commit.
  - Sửa `core/skills/**` rồi `npm run build:skills`; `git diff --stat` chỉ gồm file liên quan trước khi stage.
- Non-functional: CHANGELOG `[Unreleased]`.

## Related Code Files

- Modify: `src/runner/dispatch/config.mjs`, `.fgos/config.json`, `core/skills/_shared/coding-worker-contract.md`, `core/skills/fgos-architecture-panel/SKILL.md`, `.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**` (sinh ra), `docs/specs/runner.md`, `CHANGELOG.md`
- Tests: `test/skills/fgos-mirror.test.mjs`, `test/runner/dispatch-*config*.test.mjs`, `test/setup/*.test.mjs`

## Implementation Steps

1. Worktree `../forgentX-producer-git-tools` từ `main` (nhánh `fix/producer-git-tools`); symlink.
2. Tìm caller còn cần agent commit; quyết theo luật trên.
3. Sửa; build skills; test liên quan xanh; commit.

## Success Criteria

- [ ] `rg -n "Bash\(git (add|commit)" src core domains docs/specs .fgos/config.json` rỗng (trừ ngoại lệ đã ghi).
- [ ] Mirror test xanh.

## Risk Assessment

- Work runner loop cũ (coding) có thể vẫn để agent commit → nếu chuyển runner commit lớn hơn 0.5d, ghi ngoại lệ có chủ cho đường đó và tách item, không chặn plan.
