---
id: STR81
title: Kiểm tra lệch giữa đầu-mô-tả (frontmatter) và log cho `enduser-docs-index`
status: proposed
priority: P2
area: general
created: 2026-07-22
---

# Why

(nêu ra 2026-07-22, deferred idea của str64-backfill) — `móc-liên-kết-nguồn` trong đầu-mô-tả mỗi tài liệu là bản sao ghi-lúc-soạn, không phải nguồn thẩm quyền (log qua `fgos doc-sources` mới là nguồn thật); nếu một tài liệu được liên kết lại sau khi đầu-mô-tả đã ghi, hai bên có thể lệch mà không ai biết. Chưa xây — ưu tiên thấp, chỉ cần khi quan sát thấy lệch thật

# Done when

Một lượt kiểm (khả dĩ trong bee-grooming) phát hiện tài liệu có `móc-liên-kết-nguồn` khác với kết quả `fgos doc-sources` cho cùng đường dẫn, báo cáo rõ ràng — không tự sửa

# Notes

Migrated from the legacy backlog table. Original status: proposed.
