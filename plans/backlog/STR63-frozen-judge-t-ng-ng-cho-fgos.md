---
id: STR63
title: Frozen-judge tương đương cho fgOS
status: done
priority: P2
area: general
created: 2026-07-20
---

# Why

(nêu ra 2026-07-20, lúc so sánh kiến trúc bee↔fgOS) — fgOS đã có `footprintOverlap`/`footprintConflicts` (work-graph-intelligence S9, `graph-metrics.mjs:371`, `store.mjs:587`) ngừa xung đột GIỮA 2 work-item TRƯỚC dispatch (so `footprint` tự khai của item A với item B, gợi ý sequence/hoist/re-slice). Bee's frozen-judge (`cells.mjs:679-750`) giải bài toán KHÁC, bổ sung chứ không trùng: kiểm SAU khi return xong, MỘT item có tự ý đụng nhóm file nhạy cảm (test/CI/lockfile/manifest) NGOÀI phạm vi `footprint` đã khai của CHÍNH nó không — fgOS hiện chưa có lớp này

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
