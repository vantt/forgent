---
id: STR90
title: "`/fgOS:pick` (plugin, STR88) chỉ shell thẳng `fgos.mjs pick`, không mang trí tuệ của `fgos-routing`"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(thảo luận 2026-07-23, refine STR83) — `plugins/fgOS/skills/pick/SKILL.md:27-31` action step là đúng một dòng `node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs pick $ARGUMENTS`, không nạp `fgos-routing`/`fgos-exploring`/`fgos-planning`/`fgos-validating` — trong khi `.claude/skills/fgos-routing/SKILL.md` (STR50 induction) đã là đúng chuỗi orient→claim→route-by-stage→work→return mà một phiên dev-fgOS nội bộ dùng hôm nay. Kết quả: người ngồi trong project khác (dùng plugin `/fgOS:*` đã ship) claim xong bị bỏ lại tự improvise, không theo cùng kịch bản mà `fgos-runner` (headless) hay một phiên dev-fgOS nội bộ nhận được. Việc: đổi `/fgOS:pick` để nạp `fgos-routing` (bản domain-pluggable hoá ở STR89) ngay sau khi claim, thay vì dừng lại sau dòng shell CLI — giải luôn gray-area STR83 tự flag ("chạy tới khi xong nghĩa là gì? review/gate ở đâu?"): trả lời là "chạy đúng theo state machine mà `fgos-routing`+chuỗi stage-skill định nghĩa, dừng đúng gate mà skill đang tải quy định", không phải một vòng lặp mới. Không cần đổi tên verb — giữ `/fgOS:pick`, không thêm `/fgOS:claim` (một việc, một tên, theo DRY).

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
