---
id: STR35
title: fgos multi-session trên CÙNG checkout (dogfood run-6, 2026-07-17, phiên khác đang chạy STR32 song so
status: done
priority: P2
area: general
created: 2026-07-17
---

# Why

fgos multi-session trên CÙNG checkout (dogfood run-6, 2026-07-17, phiên khác đang chạy STR32 song song lần đầu tiên): (a) `isWorkingTreeClean` của `approve`/`return` không phân biệt "bẩn của phiên nào" — một phiên khác merge song song có thể chặn approve của phiên này 2 lần liền; (b) soát diff nhánh runner trước khi hỏi người approve mà diff thẳng với ref `main` đang di chuyển (thay vì `git merge-base`) tạo báo động giả khi có phiên khác merge song song — run-6 tự gây 1 reject oan vì lỗi này

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
