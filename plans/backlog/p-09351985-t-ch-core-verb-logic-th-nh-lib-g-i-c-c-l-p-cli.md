---
id: p-09351985
title: Tách core verb-logic thành lib gọi được độc lập CLI
status: proposed
priority: P2
area: general
created: 2026-07-27
---

# Why

— prerequisite móng mà decision 0014 nêu ("tách core (verb-logic) thành lib gọi được độc lập CLI — hôm nay logic nằm trong CLI thì kéo ra, CLI thành client mỏng"). Refactor nội bộ thuần, KHÔNG đổi hành vi; đường ghi single-door (CTR002) và lock giữ nguyên. Tách khỏi STR46 khi mở exploring 2026-07-27 vì verify của nó khác hẳn phần hợp đồng in/out (tương đương hành vi, không phải hình dạng contract). Đứng dưới mọi consumer sau: daemon (STR48) không link lib theo 0014, nhưng TUI local và code cùng-tiến-trình thì có.

# Done when

Verb-logic gọi được từ code Node mà không spawn CLI; CLI trở thành client mỏng của chính lib đó; toàn bộ test hiện có xanh không sửa một assertion nào (chứng minh không đổi hành vi)

# Notes

Migrated from the legacy backlog table. Original status: proposed.
