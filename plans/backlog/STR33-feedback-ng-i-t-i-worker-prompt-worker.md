---
id: STR33
title: "Feedback người tới worker: prompt worker (buildPrompt) thiếu answer từ gates + lý do reject mới nhất"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Feedback người tới worker: prompt worker (buildPrompt) thiếu answer từ gates + lý do reject mới nhất → vòng reject không hội tụ (run-3: reject kèm yêu cầu test, worker round-2 no-op vì không thấy lý do); kiểm fold `reason` trên work.move (đường destructure — critical pattern fold-allowlist)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
