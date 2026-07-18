---
title: Chống giao thoa tiến trình lúc cài (harness coexistence)
date: 2026-07-14
status: accepted
source_decisions: [99a8a7fc]
relates_backlog: [STR10]
relates_specs: [platform-foundations]
---

# 0009 — Chống giao thoa tiến trình lúc cài

## Bối cảnh

Tách sạch *artifacts* (file, thư mục, release) giữa forgent và các bộ công cụ khác
là **chưa đủ**. Khi fgOS có install story và được cài vào một project hoặc global
**cạnh một harness khác**, hai bên có thể **giao thoa ở tầng tiến trình**: chặn nhầm
thao tác ghi của nhau, hoặc khiến một agent nhận **mệnh lệnh điều phối mâu thuẫn**
từ hai nguồn.

> Ghi chú viết lại: quyết định gốc phát biểu trong bối cảnh tách kho phát triển ↔
> sản phẩm của chính dự án. Ở đây là **yêu cầu thiết kế platform thuần của fgOS**,
> không phụ thuộc tên harness cụ thể nào.

## Quyết định

fgOS, **khi có install story**, phải được thiết kế để **không giao thoa tiến trình**
với harness khác cùng máy. Bốn nguyên tắc:

1. **Doctrine scope theo lãnh địa:** luật/hành vi của fgOS chỉ áp trong phạm vi
   đường dẫn của chính nó.
2. **Hook gate theo path của mình:** cổng chặn chỉ kích hoạt trên path fgOS, không
   quơ lên path của harness khác.
3. **Một-nhạc-trưởng-mỗi-phiên:** trong một phiên, chỉ một bên điều phối — không hai
   nguồn cùng ra lệnh cho một agent.
4. **Phát hiện marker harness khác lúc cài:** khi cài, nhận diện dấu hiệu của harness
   khác đã có mặt và ứng xử nhường-nhịn thay vì đè lên.

## Hệ quả

- **Đây là non-functional requirement mở, CHƯA thực thi** — ghi lại để install
  design tương lai không bỏ sót. Việc thực thi nằm ở backlog **STR10**.
- **Tiêu chí kiểm** khi làm: một canary chạy trong project cài **cả hai** harness —
  hai bên không chặn nhầm write của nhau, agent không nhận mệnh lệnh điều phối mâu
  thuẫn.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
