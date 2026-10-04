---
title: "Work loop chuyển sang runner commit, bỏ quyền git của mọi worker"
description: "Coding worker của Work loop (src/runner/loop.mjs) còn tự git add/commit nên invocation vẫn phải cấp Bash(git add/commit) (ngoại lệ 0051). Chuyển commit về runner (tái dùng commit-unit-work.mjs) như đường fgos run, rồi bỏ quyền git ở mọi nơi và xoá ngoại lệ."
status: completed
priority: P2
effort: "~1–1.5d"
tags: [work-loop, runner-commit, allowedTools, security, contract]
created: 2026-10-04
blockedBy: []
blocks: []
---

# Work loop chuyển sang runner commit

## Overview

Sau plan [mutating fallback](../261003-1931-mutating-quota-fallback-and-producer-git-tools/plan.md), đường `fgos run`/Workflow đã để **runner** commit (`src/runner/execution/commit-unit-work.mjs`, `export function commitUnitWork({ worktree, unitId, summary })`), worker confined không có quyền ghi git. Còn một đường cũ: **Work loop** (`src/runner/loop.mjs`) chạy coding worker không confine (claude-cli, glm, `runner.executor` mặc định); hợp đồng worker (`core/skills/_shared/coding-worker-contract.md:91` "Commit your changes, then stop") bắt worker tự commit; goal-check (`src/runner/goal-check.mjs`) đọc commit trên nhánh item. Vì vậy `allowedTools` vẫn cấp `Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)` — ngoại lệ ghi ở `docs/specs/runner.md` § **0051** và CHANGELOG.

Mục tiêu: **một luật cho mọi đường** — worker chỉ sửa file, runner commit. Sau đó bỏ quyền git khỏi mọi invocation và xoá ngoại lệ 0051.

Phương án đã cân nhắc: cho Work loop chạy hẳn qua Workflow runner (khớp hướng P3) — **không chọn ở plan này** vì lớn hơn nhiều và `loop.mjs` bị GitNexus đánh CRITICAL; chỉ thay điểm commit, giữ nguyên vòng lặp. Ghi lại làm hướng sau trong Risk.

## Phases

| # | Phase | Phụ thuộc | Sở hữu file |
|---|---|---|---|
| 1 | [Sự thật + impact](./phase-01-facts-impact.md) | — | plan |
| 2 | [Runner commit trong Work loop](./phase-02-loop-runner-commit.md) | 1 | `src/runner/loop.mjs`, `src/runner/goal-check.mjs` (nếu cần), `src/runner/execution/commit-unit-work.mjs` (chỉ nếu cần mở rộng chữ ký), `core/skills/_shared/coding-worker-contract.md` + skill coding liên quan, render targets |
| 3 | [Bỏ quyền git + xoá ngoại lệ 0051](./phase-03-drop-git-grants.md) | 2 | `src/runner/dispatch/config.mjs`, `.fgos/config.json`, `core/skills/fgos-architecture-panel/SKILL.md`, `docs/specs/runner.md`, `CHANGELOG.md`, doctor |
| 4 | [Nghiệm thu + merge](./phase-04-verify-merge.md) | 3 | `reports/**` |

## Success Criteria

- [ ] Work loop: worker chỉ sửa file; runner commit trong worktree item sau khi worker trả về và **trước** goal-check; không thay đổi → không commit, goal-check xử lý như "worker không commit" hiện tại (verify-miss/no-change) — test.
- [ ] Hợp đồng worker không còn yêu cầu tự commit; worker tự commit (agent cũ) vẫn không làm hỏng vòng (runner thấy cây sạch → không commit thêm).
- [ ] `rg -n "Bash\(git (add|commit)" src core domains docs/specs .fgos/config.json` rỗng; ngoại lệ 0051 được thay bằng quyết định mới (supersede, không sửa tại chỗ) trong `docs/specs/runner.md`.
- [ ] Doctor cảnh báo invocation nào còn cấp `Bash(git add|commit)`.
- [ ] Chạy thật một item coding qua Work loop (executor thật hoặc giả có sửa file) → commit do runner tạo trên nhánh item, goal-check pass. Không chạy được → NOT RUN + lý do.
- [ ] Full `npm test` xanh; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| `loop.mjs` CRITICAL — đổi điểm commit làm vỡ propose/park/halt | test `test/runner/loop.test.mjs`, `test/e2e/runner-loop.test.mjs` đỏ | chỉ chèn một bước "runner commit" giữa worker trả về và goal-check; không đổi luồng khác; test e2e trước |
| Agent trong project khác (dùng fgOS global) vẫn theo hợp đồng cũ và tự commit | commit kép / cây sạch | runner commit idempotent: cây sạch → bỏ qua; ghi `commit: self` vs `commit: runner` vào worker log |
| Message commit kém hơn agent tự viết | lịch sử git khó đọc | message lấy từ Result `summary` (fenced JSON) như `commitUnitWork`; thiếu → `<itemId>: <title>` |
| Hướng dài hạn (Work loop chạy qua Workflow runner) | — | ghi vào `docs/specs/runner.md` như hướng sau; không làm ở đây |

## Câu hỏi mở

Không có.

## Sự thật phase 1

impact-analysis: degraded (không có GitNexus MCP trong phiên này; dùng rg tìm caller). Caller `runOnce` (loop.mjs:1348): `bin/fgos-runner.mjs:155` (+ `runWatch`). Điểm sửa nằm trong thân vòng retry của `claimAndDispatch` — lưới: `test/runner/loop.test.mjs`, `test/e2e/runner-loop.test.mjs`.

1. Worker trả về → goal-check: `loop.mjs:1044` (spawnWorker) → `appendWorkerLog` (~:1096) → `runGoalCheck` `:1108`. "worker không commit" = `check.passed && facts.aheadCount === 0` → `errorClass: 'verify-miss'` (~:1145). Worker timeout ném DispatchError → nhánh `catch`, không tới goal-check; retry reset về `dispatchBaseline` (`:909`) nên không cần commit ở nhánh timeout.
2. `goal-check.mjs` chỉ chạy `verify` (exit status); "có commit" do `loop.mjs` đo bằng `branchFacts().aheadCount`.
3. Quyền git còn cấp: `src/runner/dispatch/config.mjs:196`, `.fgos/config.json:19,526,566`, `core/skills/fgos-architecture-panel/SKILL.md:140`, `core/skills/_shared/coding-worker-contract.md:151,169`, `docs/specs/runner.md` (0051, :1631), ngoài ra `provider-adapter.mjs:369` suy "read-only" từ chuỗi `git add`/`git commit` trong allowedTools.
4. Yêu cầu worker tự commit: `coding-worker-contract.md:91`, 3 prompt template `src/runner/prompt-templates/worker-prompt-{default,discovery,skill-pointer}.txt` (+ snapshot `test/runner/prompt-templates.test.mjs`). Không có skill `fgos-coding-*` trong `core/skills`. Self-check Iron Law trong `worker-prompt-skill-pointer.txt` dùng `changedFiles` (diff `trunk...branch`) nên cần commit — phải đổi sang đọc cây làm việc.
5. `commitUnitWork` dùng được: `git add -A -- . :(exclude).fgos`, identity repo có sẵn, fallback identity; cây sạch → `no-changes`.

<!-- slug: work-loop-runner-commit -->
