---
title: "Vệ sinh credential confinement + an toàn pane herdr + đích tích hợp Workflow"
description: "Sửa 4 mục Medium còn mở từ code review P6: bản sao credential trong private home không được dọn và quyền lỏng (M1), trust store hạ quyền file 0600 (M4), gõ brief vào pane đang có dialog (M2), dọn worktree hardcode 'main' (M3)."
status: completed
priority: P1
effort: "~1–1.5d"
tags: [security, credentials, confinement, herdr, workflow]
created: 2026-10-03
blockedBy: []
blocks: []
---

# Vệ sinh credential confinement + an toàn pane + đích tích hợp

## Overview

Code review P6 (`plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/code-review-p6.md` §Medium) ghi 4 mục chưa sửa. M1/M4 chạm credential (codex `auth.json`, token agy, pi `auth.json`) trên **mọi project dùng fgOS**, nên làm trước. Kiểm 2026-10-03: `/tmp/fgos-confinement` mode 775, 1213 thư mục, chưa thấy file credential sót — rủi ro thật nhưng chưa lộ.

| Mục | Vị trí | Lỗi |
|---|---|---|
| M1 | `src/runner/dispatch/confinement/authority.mjs:1250-1260`, `confinement/resources.mjs` | private home chỉ dọn khi `adapterReturned`; round herdr fail/timeout/`provider-limit` (đường fallback quota) throw → home + credential ở lại tới khi `fgos-runner` loop reap (`src/runner/loop.mjs:1378`) — `fgos run` không reap; thư mục tạo 0775 (umask 002); `<dispatchId>/` cha không bị xoá |
| M4 | `src/runner/dispatch/trust-store.mjs:79-80, 282-283, 303-304` | write-tmp-then-rename tạo file mode mặc định → file credential 0600 bị hạ quyền |
| M2 | `src/runner/dispatch/herdr-round.mjs:1868-1873` | `awaitPromptReady` trả `blocked`/`timeout` chỉ ghi chú, `deliverBrief` vẫn gõ → trả lời dialog bằng brief; round treo tới idle 5 phút |
| M3 | `src/workflow/runner.mjs:107, 218`, `src/workflow/integrate.mjs:76` | đích tích hợp hardcode `'main'` → project trunk `master`/`trunk` không bao giờ dọn worktree; CHANGELOG ghi "cancelled" không tồn tại |

## Luật bằng chứng

Test tự động đi qua đường thật (`fgos run` / herdr round với herdr giả) + một lần chạy thật qua pane herdr cho M1/M2. Ca không chạy → NOT RUN + lý do.

## Phases

| # | Phase | Phụ thuộc | Sóng | Sở hữu file |
|---|---|---|---|---|
| 1 | [Vệ sinh credential (M1, M4)](./phase-01-credential-hygiene.md) | — | A | `src/runner/dispatch/confinement/{authority,resources,cleanup}.mjs`, `src/runner/dispatch/trust-store.mjs`, `src/runner/execution/run.mjs` (chỉ lời gọi reap), `src/setup/{registrations,checks}.mjs` (doctor) |
| 2 | [Pane dialog (M2) + đích tích hợp (M3)](./phase-02-pane-dialog-and-integration-target.md) | — | A (∥ 1) | `src/runner/dispatch/herdr-round.mjs`, `src/workflow/{runner,integrate,definition}.mjs`, `CHANGELOG.md` |
| 3 | [Nghiệm thu + merge](./phase-03-verify-merge.md) | 1, 2 | B | `reports/**`, docs |

## Success Criteria

- [ ] Private home + `<dispatchId>/` tạo 0700 (kể cả root `fgos-confinement`), bị xoá khi round fail/timeout/limit mà pane đóng; pane giữ lại (fallback quota) → đường dẫn ghi vào failure record và `fgos run` kế tiếp reap; doctor cảnh báo root không 0700 hoặc home mồ côi.
- [ ] Trust store ghi lại giữ nguyên mode file gốc (0600 vẫn 0600) — test.
- [ ] Readiness `blocked`/`timeout` → round fail ngay (`worker-spawn-fail`, `agent_blocked`) kèm dòng màn hình; không gõ brief — test.
- [ ] Đích tích hợp Workflow lấy từ bước integrate của Workflow (fallback `git symbolic-ref refs/remotes/origin/HEAD`, rồi nhánh hiện tại của main checkout); không còn literal `'main'` trong `src/workflow/**`; CHANGELOG sửa.
- [ ] Trả lời câu hỏi mở của review: producer `workspace-write` trong linked worktree commit được dưới bwrap không (test hoặc chạy thật).
- [ ] Full `npm test` xanh; merge `main`; CHANGELOG `[Unreleased]`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Xoá home khi pane còn sống làm agent trong pane mất credential | agent trong pane giữ lại báo lỗi auth | chỉ xoá khi pane **đã đóng**; pane giữ lại → ghi path, reap sau khi pane đóng |
| Root `/tmp/fgos-confinement` do user khác tạo | chmod thất bại | dùng root theo user (`fgos-confinement-<uid>`) nếu không sở hữu root; doctor báo |

## Decisions

- **2026-10-03, owner: no git write grant for workers; the runner commits.** The grant on `objects`, `refs/heads` and `logs` of the main checkout (added to let a `workspace-write` producer commit from a linked worktree) is removed: it would let a worker move `refs/heads/main` and overwrite objects of the whole repository. A confined worker writes files in its Unit worktree and its outbox only; every git path (own gitdir and common dir) is read-only. After a producer round passes, the runner (trusted, outside the confinement) runs `git add -A` (minus `.fgos/`) and `git commit` with the agent's summary as message; no change → no commit, recorded as `no-changes`. The effective execution contract no longer lists `git add`/`git commit` for workers.

## Câu hỏi mở

Không có.

<!-- slug: confinement-credential-hygiene-and-pane-safety -->
