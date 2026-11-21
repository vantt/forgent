---
id: STR45
title: "`.fgos/events.lock` (STR35 Epic 3) chỉ đóng đua trùng-seq tại chính `appendEvent` — không làm các th"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

`.fgos/events.lock` (STR35 Epic 3) chỉ đóng đua trùng-seq tại chính `appendEvent` — không làm các thao tác đọc-sửa-ghi cấp cao ở `store.mjs` (kiểm id-đã-tồn-tại của `addWork`, CAS `expectedStatus` của `moveWork`) nguyên tử liên-tiến-trình; hai lệnh `fgos` tương tác song song trên CÙNG một id vẫn có thể mỗi bên qua tiền-kiểm cũ rồi ghi hai sự kiện hợp-lệ-nhưng-mâu-thuẫn

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
