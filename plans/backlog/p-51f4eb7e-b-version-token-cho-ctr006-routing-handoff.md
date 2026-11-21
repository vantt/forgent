---
id: p-51f4eb7e
title: Bù version token cho CTR006 (routing-handoff)
status: proposed
priority: P2
area: general
created: 2026-07-27
---

# Why

— decision 0011 bắt mọi contract mang `<name>/v<N>`; CTR006 khai "designed — spec đầy đủ, chưa có code implement" (architecture-map.md:350) và `routing-handoff-contract.md` không mang field version nào. Để NGOÀI biên STR46 khi chốt exploring 2026-07-27: dán version lên thứ chưa chạy là đóng dấu cho giả định, không phải cho hành vi. Làm khi CTR006 có code thật, cùng lượt với lần implement đầu tiên.

# Done when

CTR006 mang version token đúng khuôn 0011, và token đó đối chiếu được với code đang chạy chứ không chỉ với spec

# Notes

Migrated from the legacy backlog table. Original status: proposed.
