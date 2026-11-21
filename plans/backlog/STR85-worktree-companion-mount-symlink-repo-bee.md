---
id: STR85
title: "`worktree-companion` mount (symlink `repo` + `.bee/companion-session.json`, backed bởi fgOS session dưới `/tmp/fgos-sessions/<id>/`) tự biến mất giữa phiên, không có `rm` nào trong transcript"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(ghi nhận 2026-07-23 từ 2 friction độc lập trong `.bee/backlog.jsonl`: str77-79-doc-gap-fixes 2026-07-22T14:58 — symlink+marker mất, dữ liệu `/tmp` còn nguyên; str76-runner-bootstrap-e5 2026-07-23T05:42 — nặng hơn, cả target `/tmp/fgos-sessions/<id>/` cũng mất) — root cause CHƯA xác định (nghi: `/tmp` TTL/cleanup sweep, race với phiên worktree khác, hoặc lifecycle của chính cơ chế `fgos session`/`src/runner/worktree.mjs`). Đi kèm 2 friction phụ tái hiện cùng mount (bounded, có thể tách cell riêng khi ai đó nhận việc): `commands.verify`'s distill-check step vỡ vì `../` relative từ trong symlink leo lên `/tmp/fgos-sessions/` thay vì workshop root; workshop `.gitignore`'s `repo/` (dir-only) không match symlink tên `repo` (`git check-ignore -v repo` xác nhận exit 1). (Friction thứ 3 — bee-write-guard.mjs thiếu companion-marker awareness — đã fix ở commit `0c30cf4`, rút khỏi scope item này.) Cùng họ scope-split với STR65/STR84: có thể là bee-core (beegog) hoặc fgOS runner session lifecycle (`repo/src/runner/`), chưa biết trước khi root-cause. Context đầy đủ: `docs/history/worktree-companion-mount-ephemeral/CONTEXT.md`

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
