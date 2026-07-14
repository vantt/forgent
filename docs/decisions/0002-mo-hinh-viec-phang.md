---
title: Mô hình việc phẳng — một loại item, một FSM, deps, frontier toàn cục
date: 2026-07-14
status: accepted
source_decisions: [fd17309a]
relates_specs: [work-state]
---

# 0002 — Mô hình việc phẳng

## Bối cảnh

forgent cần một mô hình dữ liệu cho công việc tự-quản, đồng thời mở đường cho hướng
nhiều-agent chạy song song (fan-out). Cám dỗ quen thuộc là dựng cấp bậc entity
riêng: epic ⊃ story ⊃ task, mỗi cấp một schema. Cách đó nhân bội bề mặt trạng thái
và khoá độ mịn công việc vào schema.

## Quyết định

- **Một loại work item duy nhất, một FSM duy nhất.** Item trỏ **deps** vào nhau.
- **"Epic" chỉ là một item thường** được các item khác trỏ deps tới — không phải một
  cấp entity riêng.
- Vòng đời cấp-câu-chuyện (bối cảnh, phê duyệt) là **thuộc tính/tài liệu gắn vào
  item**, không phải entity mới.
- **Frontier sẵn-sàng** = tập mọi item có toàn bộ deps đã xong, **derive toàn cục**
  từ trạng thái — không phải danh sách duy trì bằng tay.

## Hệ quả

- **Fan-out đa-agent xuyên câu chuyện tự nhiên:** frontier gom mọi việc làm-được-ngay
  bất kể chúng thuộc "epic" nào.
- **Việc-kế-tiếp là một truy vấn derive,** không phải danh sách người ta cập nhật tay
  — đúng tiêu chí "agent lạ tự tìm việc kế tiếp từ state".
- **Độ mịn item là kỷ luật planning, không phải tính chất schema:** muốn nhỏ hơn thì
  tách item + deps, không cần thêm loại entity.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
