---
id: STR84
title: "bee-core: ép `bee worktree new` dùng `--with-companion` (hoặc từ chối) khi phiên sắp đụng `repo/`"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(tách ra 2026-07-23 từ STR65 — scope quyết định: STR65 vòng này chỉ sửa fgOS side; phần bee-core `isConcurrentMode()` (`.bee/bin/lib/claims.mjs`) đã có tín hiệu phiên-khác-đang-live nhưng `bee-write-guard.mjs` chưa dùng nó để chặn ghi trần vào `repo/` dùng chung — cần beegog (bee-core), không phải file vendored/hash-tracked trong workshop này)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
