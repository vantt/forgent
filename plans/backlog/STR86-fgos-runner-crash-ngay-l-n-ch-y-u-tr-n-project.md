---
id: STR86
title: "`fgos-runner` crash ngay lần chạy đầu trên project mới: `git worktree add` chết vì repo chưa có commit nào (`HEAD` không resolve)"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(ghi nhận 2026-07-23 từ friction `.bee/backlog.jsonl` ts `2026-07-23T07:12:51.773Z`, layer `runner`) — người dùng báo: trong một project fresh-init, `fgos-runner --once` lỗi ngay: `git worktree add -b fgw/<id> <path>` trả `fatal: Not a valid object name: 'HEAD'`. Root cause: repo chưa từng commit nên `HEAD` không resolve, mà `git worktree add -b <branch> <path>` cần một start-point hợp lệ. **Bằng chứng thật (2026-07-23, task `tsk-2rl5`):** claim `todo -> doing` thành công, nhưng cả 2 lần thử đều fail y hệt (`worktree-fail` attempt 1 và attempt 2, kể cả sau khi retry với worktree/branch mới) — chứng minh retry KHÔNG tự hồi phục được điều kiện này (branch reuse không đổi việc `HEAD` vẫn không resolve) — runner đốt 2 attempt rồi `parked` item thay vì phát hiện sớm. Chưa có message hướng dẫn rõ nguyên nhân, người dùng phải tự đoán "chạy `git commit` trước". **Cần quyết định trước khi shape:** fgos-runner nên tự tạo initial commit (nếu quy ước project cho phép) hay chỉ fail sớm với message rõ "cần `git commit` trước khi chạy runner" — gray-area thật, cần chốt trước khi vào planning. **Hướng thêm (2026-07-23, người dùng gợi ý khi review item này):** thay vì (chỉ) chặn ở runner lúc fail, cân nhắc chặn SỚM HƠN ở `fgos init` — sau khi init xong, chủ động báo người dùng tự `git commit` nếu repo còn HEAD-less, thay vì để runner mới phát hiện ở lần chạy đầu. Hai hướng (init-time nudge vs runner-time detect-and-fail vs runner auto-commit) không loại trừ nhau, cần cân nhắc chung khi shape.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
