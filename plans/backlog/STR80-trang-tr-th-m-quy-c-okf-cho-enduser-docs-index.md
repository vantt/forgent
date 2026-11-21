---
id: STR80
title: "Trang trí thêm quy ước OKF cho enduser-docs-index: `index.md` mỗi ngăn (progressive disclosure) + `log.md` lịch sử đổi theo ngày"
status: proposed
priority: P2
area: general
created: 2026-07-22
---

# Why

(nêu ra 2026-07-22 lúc bàn str64-backfill, deferred idea của CONTEXT.md area này) — hiện chỉ mục máy-đọc (`docs/enduser-docs-index.json`) là bảng tra duy nhất; một `index.md` per-thư-mục cho người/agent duyệt nhẹ một ngăn mà không cần load cả manifest. Chưa cần ngay — chỉ đáng làm khi số tài liệu mỗi ngăn tăng thật (hiện `explanation` mới 23 mục, `how-to` 1 mục)

# Done when

Mỗi thư mục `docs/<quadrant>/` có `index.md` liệt kê + mô tả ngắn các tài liệu trong đó; không đổi hành vi chỉ mục JSON hiện có

# Notes

Migrated from the legacy backlog table. Original status: proposed.
