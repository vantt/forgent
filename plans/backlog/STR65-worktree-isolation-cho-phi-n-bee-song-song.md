---
id: STR65
title: Worktree isolation cho phiên bee song song trong cùng checkout
status: done
priority: P2
area: general
created: 2026-07-20
---

# Why

(điều tra tận gốc 2026-07-20, xuất phát từ 3 lần commit lạ `"worker: output.txt"` đè mất dòng `docsRef` trong `bin/fgos.mjs` giữa lúc p50-workflow-induct Phase 2 thi công) — xác nhận bằng transcript trực tiếp (`~/.claude/projects/.../d728e552-....jsonl`, 2026-07-19 17:41:46): KHÔNG phải bee tự động (bee không có cơ chế tự git-commit), KHÔNG phải bug test suite (`test/runner/loop.test.mjs:29` cô lập đúng qua `fs.mkdtempSync`), KHÔNG phải tiến trình lạ trên máy (ps/cron/systemd đã kiểm, không có gì chạm checkout) — là **3 phiên bee ĐỘC LẬP chạy thật, song song, trong CÙNG một checkout**: `fgos-sample-testbed` (dispatch `fixture-worker-multiply`/`builder-fgos-sample-testbed-1`), `str60-fgos-return-cleanliness-fix`, `p50-workflow-induct`. Cơ chế: race trên `.git/index` dùng chung — đúng critical-pattern đã ghi ngày 20260718 ("git-add-scope": broad add/commit quét nhầm thay đổi chưa commit của phiên khác). AGENTS.md rule 14 đã có paved road (`bee worktree new --feature <slug>`) nhưng không phiên nào trong 3 phiên trên dùng. **Thêm bằng chứng (2026-07-20, grooming p50-workflow-induct):** một occurrence khác cùng nguyên nhân gốc, filed riêng làm review-finding #1 của p50-workflow-induct's review (đóng làm duplicate của STR65 này, không fix riêng) — 2 sự cố cụ thể có SHA: commit `b63c530` âm thầm nuốt một sửa test của cell này vào commit đã amend của phiên khác; commit `d2fd615` xoá mất 7 dòng vừa commit (docsRef wiring trong `bin/fgos.mjs`), gây regression 2 test CLI. Chi tiết đầy đủ: `.bee/backlog.jsonl` (title "worker: output.txt" auto-commits, 2026-07-19T10:40:40Z). **Escalation count (grooming failure-analysis, 2026-07-20):** đây KHÔNG phải sự cố hiếm — đếm được 12 occurrence riêng biệt trong `.bee/backlog.jsonl`, leo thang P3→P2→P1 trải dài 2026-07-17 tới 2026-07-19 (reservation bị giữ bởi phiên khác, `state.json` bị race, `git add -A`/`git commit -- <pathspec>` quét nhầm 487 file của phiên khác, subagent tự commit dù được dặn để nguyên, v.v.). Nghi vấn thêm: test flaky lặp lại ở `test/state/events.test.mjs`'s concurrent-OS-process seq test (thấy lại 2026-07-20 trong groom-cleanup-1, "pass khi chạy riêng/pass lại lần 2" — ĐÃ bị kết luận là flaky nhưng KHÔNG được đối chiếu với STR65) có thể là canary của chính race này, không phải flaky thuần. Cơ chế fix đã tồn tại từ 2026-07-17 (`fgos-multi-session-checkout`, `bee worktree new --feature <slug>`) — vấn đề còn lại là KHÔNG CÓ GÌ ép buộc dùng nó, không phải thiếu cơ chế. **Scope quyết định 2026-07-23:** cả 3 sự cố có SHA đều là race trên `repo/`'s `.git/index` (decision `af7d1dc1`, `scope: "repo"`), không phải workshop's `.git` — nên fix vòng này scope vào fgOS side (`bin/fgos.mjs`/runner: phát hiện phiên khác đang live cùng `repo/` checkout, chặn/guard commit trần); bee-core enforcement (`bee worktree new` ép `--with-companion` khi đụng `repo/`) tách thành backlog item riêng, không block STR65

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
