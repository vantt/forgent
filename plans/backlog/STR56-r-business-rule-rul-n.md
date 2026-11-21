---
id: STR56
title: "`R#` business rule → `RUL<n>`"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

(chốt tại `docs/platform/documentation/history/id-systems-audit.md`, làm SAU STR54/STR55 để mẫu tiền tố đã chạy trơn): `runner.md` (R1-R43) + 4 spec khác đang có `R#` riêng (`platform-foundations.md`, `distribution.md`, `work-state.md`, và spec còn lại) đều đổi tiền tố. Bước đầu BẮT BUỘC: liệt kê ĐỦ mọi chỗ `R[0-9]+` xuất hiện (định nghĩa lẫn trích dẫn) trước khi đổi, không chỉ sửa định nghĩa gốc — đây là migration có quy mô, không phải rename 1 chỗ. `R#` vẫn KHÔNG unique toàn cục sau đổi tên (mỗi spec tự đếm riêng) — trích dẫn NGOÀI spec gốc phải kèm tên area (vd `RUL42 (STANCE trí-tuệ-giao-việc) (runner)`)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
