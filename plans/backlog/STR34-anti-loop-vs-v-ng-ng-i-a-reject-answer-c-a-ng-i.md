---
id: STR34
title: "Anti-loop vs vòng người: (a) reject/answer của NGƯỜI hiện ăn cùng ngân sách visit với vòng lỗi → ite"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Anti-loop vs vòng người: (a) reject/answer của NGƯỜI hiện ăn cùng ngân sách visit với vòng lỗi → item bị park 3/3 TRƯỚC khi worker kịp thấy lý do reject (run-4); (b) item nhánh-runner bị anti-loop park xong thì KHÔNG còn cửa công khai nào cho người hoàn tất đề xuất (pull-door đo main, không hợp việc trên nhánh; classifier cũng chặn đẩy tay — đúng tinh thần). Thiết kế: can thiệp người (answer/reject) làm mới/mở rộng ngân sách visit? verb người-tiếp-quản-nhánh?

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
