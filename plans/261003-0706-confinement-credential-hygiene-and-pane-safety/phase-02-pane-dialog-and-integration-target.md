---
phase: 2
title: "Pane dialog (M2) + đích tích hợp (M3)"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 2: Pane dialog (M2) + đích tích hợp (M3)

## Overview

Không gõ brief vào pane đang có dialog; đích tích hợp Workflow không hardcode `main`.

## Requirements

- Functional:
  - **M2** `herdr-round.mjs:1868-1873`: `awaitPromptReady` = `blocked` → `round.fail('worker-spawn-fail', 'agent_blocked', …)` kèm `lastScreenLine`; = `timeout` → fail tương tự, không submit. Fail này đi vào phân loại hiện có (không tính là `provider-limit`).
  - **M3**: đích tích hợp = `target` khai ở bước `kind: integrate` của Workflow; không khai → `git symbolic-ref refs/remotes/origin/HEAD`; không có → nhánh hiện tại của main checkout. Dùng chung cho kiểm "đã tích hợp" (`runner.mjs:107`) và merge (`runner.mjs:218`, `integrate.mjs:76` bỏ default `'main'`). Schema Workflow (`src/workflow/definition.mjs`) nhận `target` ở bước integrate.
  - CHANGELOG: sửa "complete, failed or cancelled" → đúng trạng thái có thật.
  - **Câu hỏi mở của review**: producer `workspace-write` trong linked worktree commit được dưới bwrap không. Grant `workspace-git-metadata` resolve từ worktree, còn object store và refs chung của git nằm ở main checkout (read-only). Viết test (bwrap thật nếu có, skip có lý do nếu không) và sửa grant nếu commit bị chặn.
- Non-functional: guard `rg "'main'" src/workflow` rỗng (ngoài comment).

## Related Code Files

- Modify: `src/runner/dispatch/herdr-round.mjs`, `src/workflow/runner.mjs`, `src/workflow/integrate.mjs`, `src/workflow/definition.mjs`, `src/runner/dispatch/confinement/policies.mjs` (chỉ nếu grant git sai), `CHANGELOG.md`
- Tests: `test/runner/herdr-*.test.mjs`, `test/workflow/*.test.mjs`, `test/runner/dispatch-confinement-*.test.mjs`

## Implementation Steps

1. Worktree `../forgentX-pane-safety` từ `main` (nhánh `fix/pane-dialog-integration-target`); symlink.
2. Test trước: herdr giả trả screen blocked → round fail, không có lệnh gõ; repo trunk `master` → worktree Unit pass được dọn; Workflow khai `target` → merge vào đó; producer commit trong linked worktree dưới bwrap.
3. Sửa; test xanh; commit.

## Success Criteria

- [ ] Test trên xanh; guard `'main'`.

## Risk Assessment

- `origin/HEAD` không có ở repo local-only → fallback nhánh hiện tại; test.
